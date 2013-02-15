#!/usr/bin/env ruby

#  
#  Simple SSL certificate expiration date checker
#

require 'net/https'
require 'date'
require 'time'

$today = DateTime.now

sitesArray = ["https://google.com",
              "https://mail.yahoo.com",
              "https://www.cnn.com"]
              
def getDays(url)
  uri = URI.parse(url)
  http = Net::HTTP.new(uri.host,uri.port)
  http.use_ssl = true
  http.verify_mode = OpenSSL::SSL::VERIFY_NONE
  http.start do |h|
    @cert = h.peer_cert
  end
   expire = DateTime.parse(@cert.not_after.to_s)
   days = (expire - $today)
   return days.to_i
end

sitesArray.each do |url|
  res = getDays(url.to_s)
  puts "#{url} expires in : #{res} days"
end