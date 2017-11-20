require 'mysql2'
require 'yaml'

client = Mysql2::Client.new(YAML.load_file('./database_info.yaml'))
client.query_options[:symbolize_keys] = true

result = client.query('select task_id, hour from daily')
result.each do |item|
  p item
end

# begin
#   client.query('BEGIN')
#   client.query('alter table daily modify hour int default 0')
#   result.each do |item|
#     client.query("update daily set hour = #{item[:hour] * 60} where task_id = #{item[:task_id]}")
#   end
#   client.query('COMMIT')
# rescue => e
#   client.query('ROLLBACK')
#   p e.class
#   p e.message
# end
