#!/usr/bin/env ruby

#
# A quick / ugly threaded remote host time checker, based on: 
# nmap installed 
# ssh keys in place for each systems
# and the ability to ping (arp "-PR" or ICMP "") the target hosts
# **arp scan requires root privs last time I checked so YMMV
#

SSH_USERNAME="username"
SSH_KEY="/home/username/.ssh/ssk_key_file"
EXCLUDED_IPS="172.16.10.1,172.16.10.20-21,172.16.10.180-254"

def get_ip_list(network_range, excluded, type)
  ip_list = %x[nmap -sP #{type} -n #{network_range} --exclude #{excluded} | grep "is up" | awk '{print $2}']
end

def get_target_system_time(ip, cmd)
  system_time = %x[ssh -i #{SSH_KEY} #{SSH_USERNAME}@#{ip} #{cmd} ].split("\n")  
  puts "#{system_time[0]}\t#{system_time[1]}"
end

threads = []
iplist = get_ip_list("172.16.10.0/24", EXCLUDED_IPS, "").split("\n")
iplist.each do |ip|
  threads << Thread.new{get_target_system_time(ip, "hostname;date")}
end
threads.each { |aThread|  aThread.join }

