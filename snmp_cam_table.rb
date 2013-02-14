#!/usr/bin/env ruby

# jstout 02/14/2013
# pull cam table (reverse mac address to switch ports) from a target switch
#   
#   *** this is just a silly wrapper for snmpwalk and arp, cause I am lazy.  Also the mibs 
#   might be only useable on my switch ***

DEBUG = false
switches = ARGV[0]
$comm_string = "SCRUBBED" 
$mac_add_mib = ".1.3.6.1.2.1.17.4.3.1.1"
$switch_ports_mib = ".1.3.6.1.2.1.17.4.3.1.2"
$cam_table = []

def get_arptable
  arp_cmd = "/usr/sbin/arp"
  arp_table_raw = %x[#{arp_cmd}]
  arp_count = arp_table_raw.split("\n").size - 1
  arp_table = arp_table_raw.split("\n").last(arp_count)
  clean_table = []
  arp_table.each do |line|
    clean = line.strip.split.join(" ").split(" ")
    clean_table.push << clean
  end
  return clean_table
end

def get_port_oid(string)
  string.slice!("SNMPv2-SMI::mib-2.17.4.3.1.2.")
  string.slice!(" = INTEGER:")
  oid = string.split[0].to_s
  port = string.split.last.to_s
  return oid,port
end

def get_mac_oid(string)
  string.slice!("SNMPv2-SMI::mib-2.17.4.3.1.1.")
  string.slice!(" = Hex-STRING:")
  oid = string.split[0].to_s
  mac = string.split.last(6).join(":").to_s.downcase
  return oid,mac
end

def getsnmpresults(target,community_string,oid)
  walkcmd = "snmpwalk -v 1 -c #{community_string} #{target} #{oid}"
  interfaces = %x[#{walkcmd}]
  return interfaces
end

# Pull snmp from switches and populate cam_table
switches.each do |switch|
  switch_ports = getsnmpresults(switch,$comm_string,$switch_ports_mib)
  puts switch_ports.split("\n").size if DEBUG
  switch_ports.split("\n").each do |mac|
    oid,port = get_port_oid(mac)
    hash = { :oid => "#{oid}", :mac => "", :switch => "#{switch}", :switch_port => "#{port}", :ip => ""}
    $cam_table.push(hash)
  end
  mac_add = getsnmpresults(switch,$comm_string,$mac_add_mib)
  puts mac_add.split("\n").size if DEBUG
  mac_add.split("\n").each do |p|
    oid,mac = get_mac_oid(p)
    hash = $cam_table.find { |h| h[:oid] == oid}
    hash[:mac] = mac
  end
pp $cam_table if DEBUG
end

# Pull arp table and futher populate cam_table
arp_table = get_arptable
arp_table.each do |line|
   mac = line[2]
   ip = line[0]
   hash = $cam_table.find { |h| h[:mac] == mac}
   hash[:ip] = ip if not hash.nil?
end

$cam_table.each do |entry|
  puts entry.inspect if not entry[:ip].nil?
end
