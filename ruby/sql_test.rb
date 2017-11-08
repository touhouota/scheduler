require "mysql2"
require "json"

client = Mysql2::Client.new(host: "localhost", username: "research", password: "do_research", encoding: "utf8", database: "do_research")

sql = "select * from daily where user_id = '1013179' order by date desc limit 1"
hoge = client.query(sql).entries

hash = {"data": JSON.generate(hoge), "user_id": "1013179"}
p json = JSON.parse(hash[:data], symbolize_names: true)
p json.first
p json.first[:task_detail]
