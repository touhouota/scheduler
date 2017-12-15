require 'mysql2'
require 'yaml'
require './process_subtree'

$client = Mysql2::Client.new(YAML.load_file('./database_info.yaml'))
# デフォルトでkeyをsymbolにする
$client.query_options[:symbolize_keys] = true

print '繰り返す回数は？:'
num = gets.to_i

num.times do |i|
  p insert_timeline(user_id: 1_013_179, comment: "#{i}: #{Time.now.strftime('%F %T')}")
end
