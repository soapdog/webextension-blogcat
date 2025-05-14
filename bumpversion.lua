#!/opt/local/bin/lua

require "pl"
local markdown = require 'markdown_extra'
local template = require 'pl.template'
local json = require 'dkjson'

local manifestRaw = file.read('manifest.json')
local manifest, pos, err = json.decode(manifestRaw, 1, nil)

if err then
  print("Error: " .. err)
  os.exit(1)
end

local currentVersion = manifest['version']
local today = Date()
local year = today:year()
local month = today:month()

print("Current version: " .. currentVersion)

local prefix = year .. "." .. month
local newVersion = ""

if not stringx.startswith(currentVersion, prefix) then
  newVersion = prefix .. ".1"
else
  local buildNumber = currentVersion:gsub(prefix .. ".", "")
  newVersion = prefix .. "." .. (math.floor(buildNumber + 1))
end

print("New version: " .. newVersion)

--[[
===== Change manifest =====================================

Can't serialise `manifest` into json and save cause the keys
go all out of order.
--]]

local newManifest = manifestRaw:gsub(currentVersion, newVersion)

file.write("manifest.json", newManifest)

--[[
===== Save empty release notes =====================================
--]]

local releaseNotes = [[
# Release Notes VERSION

]]

file.write("docs/release-notes/" .. newVersion .. ".md",
  releaseNotes:gsub("VERSION", newVersion))

--[[
===== Fix buildrss.lua =====================================
--]]

local buildRSSRaw = file.read("buildrss.lua")
local lineToFind = '"' .. currentVersion .. '",'
local lineToReplace =
[["NEW",
  "CURRENT",]]

lineToReplace = lineToReplace:gsub("NEW", newVersion):gsub("CURRENT",
  currentVersion)

buildRSSRaw = buildRSSRaw:gsub(lineToFind, lineToReplace)


file.write("buildrss.lua", buildRSSRaw)
