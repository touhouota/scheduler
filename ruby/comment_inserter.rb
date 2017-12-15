require 'mysql2'
require 'yaml'
require 'process_subtree'

$client = Mysql2::Client.new(YAML.load_file('./database_info.yaml'))
# デフォルトでkeyをsymbolにする
$client.query_options[:symbolize_keys] = true

num = 10

num.times do |i|
  p insert_timeline(user_id: 1_013_179, comment: "#{i}: #{Time.now.strftime('%F %T')}")
end
