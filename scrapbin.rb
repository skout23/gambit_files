#!/usr/bin/env ruby

require 'timeout'
require 'net/http'
require 'uri'

#A simple wrapper method that accepts either strings or URI objects
#and performs an HTTP GET.

AgentList = ["Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.2; .NET CLR 1.1.4322)",
            "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.2; SV1; .NET CLR 1.1.4322)",
            "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)",
            "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)",
            "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.14) Gecko/20080404 Firefox/2.0.0.14",
            "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)"]
#  return AgentList[rand(AgentList.size)]
class Array
  def shuffle!
    size.downto(1) { |n| push delete_at(rand(n)) }
    self
  end
end

module Net
  class HTTP
    def HTTP.get_with_headers(uri, headers=nil)
      uri = URI.parse(uri) if uri.respond_to? :to_str
      start(uri.host, uri.port) do |http|
        return http.get(uri.path, headers)
      end
    end
  end
end

def getPasteBin(binNum)
  pbn = binNum
  res = Net::HTTP.get_with_headers("http://www.pastebin.ca/raw/#{pbn}",{'User-Agent' => "#{AgentList[rand(AgentList.size)].to_s}"})
  return res
end

def buildPbArray(first, last)
  pbArr = Array.new
  if (last < first)
    puts "Ranges got to be small to large duh!"
    exit
  else
    (first..last).each { |t|
      pbArr |= ["#{t}"]
    } 
    return pbArr
  end
end

$missed = Array.new
$targets = Array.new
retries = 2
rangeStart = ARGV[0].to_s.to_i
rangeEnd = ARGV[1].to_s.to_i

ranPBrange = buildPbArray(rangeStart,rangeEnd)

ranPBrange.shuffle.each { |i| 
  puts "Trying [#{i}]"
  begin
    Timeout::timeout(5) do
      dork = getPasteBin(i)
      if dork.body =~ /[Pp]assword|[Pp]wd|[Pp]asswd|[Pp]ass|PASSWORD|PASSWD|PASS|PWD/
        puts "Found a possible password: http://www.pastebin.ca/raw/#{i}"
        $targets |= ["#{i}"]
        dork.body.match( /[Pp]assword|[Pp]wd|[Pp]asswd|[Pp]ass|PASSWORD|PASSWD|PASS|PWD/ ) do |line|
          puts line
        end
        printf("\n\n")
      end
    end
  rescue Timeout::Error  
    if retries > 0
      retries -= 1
      retry
    else
      $missed |= ["#{i}"] 
      next
    end
  end      
  sleep(rand(3))
}

puts "list of Missed pastebins"
$missed.sort.each { |t| puts "http://www.pastebin.ca/raw/#{t.to_s}" }
printf("\n\n")
puts "list of Possible passwords"
$targets.sort.each { |t| puts "http://www.pastebin.ca/raw/#{t.to_s}" }

