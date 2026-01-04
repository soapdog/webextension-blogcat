#!/opt/local/bin/lua

require "pl"
local markdown = require "markdown_extra"
local template = require 'pl.template'

local versions = {
  "2026.1.1",
  "2025.10.3",
  "2025.10.2",
  "2025.10.1",
  "2025.9.3",
  "2025.9.2",
  "2025.9.1",
  "2025.5.1",
  "2025.4.6",
  "2025.4.5",
  "2025.4.4",
  "2025.4.3",
  "2025.4.2",
  "2025.4.1",
  "2025.3.12",
  "2025.3.11",
  "2025.3.10",
  "2025.3.9",
  "2025.3.8",
  "2025.3.7",
  "2025.3.6",
  "2025.3.5",
  "2025.3.4",
  "2025.3.3",
  "2025.3.2",
  "2025.3.1",
  "2025.3.0",
}

local today = Date()

function dateRFC822(date)
  local MONTHS = {
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  }

  local WDAYS = {
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  }

  -- Output a date and time in RFC 2822 compliant format.
  --
  -- This ensures the month and day of week are output in the compliant English
  -- format (instead of relying on os.date, which can be affected by the current
  -- system's locale).
  function ss(time)
    local data = os.date("*t", time)
    local month = MONTHS[data["month"]]
    local wday = WDAYS[data["wday"]]
    return os.date(wday .. ", %d " .. month .. " %Y %H:%M:%S %z", time)
  end

  if type(date) == "string" then
    local p = "(%d+)-(%d+)-(%d+)"
    local year, month, day = date:match(p)

    return ss(os.time({ year = year, month = month, day = day }))
  else
    return ss(date)
  end
end

function getReleaseNotes(version)
  local content = file.read("./docs/release-notes/" .. version .. ".md")
  local html, metadata = markdown.from_string(content)
  return html
end

function modifiedTime(version)
  local t = file.modified_time("./docs/release-notes/" .. version .. ".md")
  return dateRFC822(t)
end

local env = {
  date = today,
  versions = versions,
  getReleaseNotes = getReleaseNotes,
  modifiedTime = modifiedTime,
  ipairs = ipairs,
}

local rss_template = [==[
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>BlogCat Feed</title>
    <link>https://blogcat.org/</link>
    <generator>Lua 5.3</generator>
    <description>An add-on for Firefox that makes blogging a first class citizen.</description>
    <language>en-gb</language>
    <lastBuildDate>$(today)</lastBuildDate>
    <managingEditor>blogcat@andregarzia.com</managingEditor>
    <webMaster>blogcat@andregarzia.com</webMaster>
# for i,val in ipairs(versions) do
    <item>
      <author>blogcat@andregarzia.com</author>
      <pubDate>$(modifiedTime(val))</pubDate>
      <title>Release $(val)</title>
      <link>https://blogcat.org/#/release-notes/$(val)</link>
      <guid>https://blogcat.org/#/release-notes/$(val)</guid>
      <description><![CDATA[
      $(getReleaseNotes(val))
      ]]>
      </description>
    </item>
# end
  </channel>
</rss>
]==]

local res, err = template.substitute(rss_template, env)

if (res) then
  file.write("./docs/rss.xml", res)
  print("ok")
end
