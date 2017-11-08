# coding: utf-8
require 'date'
require './mail'
require 'mysql2'

mail = SendMail.new(to: "ika@sketch.jp", from: "g2117034@fun.ac.jp", option:{server: "smtp.gmail.com", port: 465})

# subject
yesterday = DateTime.now - 1
subject = "#{yesterday.strftime("%m月%d日")}のみんなの様子 - スケジューラ"

# body
client = Mysql2::Client.new(host: "localhost", username: "research", password: "do_research", encoding: "utf8", database: "do_research")
yesterday_str = yesterday.strftime("%Y-%m-%d")
sql = "select * from daily join users using(user_id) where date = '#{yesterday_str}'"
yesterday_tasks = client.query(sql).entries
users = yesterday_tasks.inject({}) do |hash, entry| 
  hash[entry["name"]] = {tasks: 0, fin: 0} unless hash.dig(entry["name"])
  # ユーザ名を数える => その日のタスク数がわかる
  hash[entry["name"]][:tasks] += 1
  # statusが2のものを数える => 完了した数がわかる
  if(entry["status"] == 2) then
    hash[entry["name"]][:fin] += 1
  end
  hash
end
body = "#{yesterday.strftime("%m月%d日")}の美馬研の様子は以下の通りでした。\n\n"
if users.length > 0 then
users.each do |user, info|
  body += "・#{user}の活動\n"
  body += "=>#{info[:tasks]}個のタスクを登録し、#{info[:fin]}個を終わらせました！\n\n"
end
else 
  body += "誰も活動していないようです...（´・ω・`）\n\n"
end
body += "今日も頑張って行きましょう！\n"
body += "http://mimalab.c.fun.ac.jp/b1013179/scheduler/list.html"

mail.send(subject: subject, body: body)
