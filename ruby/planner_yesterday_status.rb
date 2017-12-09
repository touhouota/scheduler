require 'time'
require 'mysql2'
require 'date'
require 'yaml'
require './mail'
require './mail_content_creater'

######
# main
######

client = Mysql2::Client.new(YAML.load_file('./database_info.yaml'))
# デフォルトでkeyをsymbolにする
client.query_options[:symbolize_keys] = true

# 今日、昨日の日付をyyyy-mm-ddで取得
today = Date.today.strftime('%F')
yesterday = (Date.today - 1).strftime('%F')

client.query('select * from groups').each do |group|
  p group[:group_name]
  # mailアドレスが設定されていない場合は無視する
  next if group[:mail].nil?
  # メールアドレスが設定されているグループには、そこあてにメールを送る
  mail = SendMail.new(to: 'g2117034@fun.ac.jp', from: 'planner@sketch.jp', option: { server: 'po.sketch.jp', port: 587, ssl: false })

  body = count_down(group[:group_name])
  # グループに属している人のTL内容を取得
  search_query = <<-SQL
  select * from task_timeline join (task join users using(user_id)) using(task_id)
  where users.group_id = ? and Date(task_timeline.created) between ? and ?
  SQL

  body += "昨日の#{group[:group_name]}の様子は以下の通りでした。\n\n"
  result = client.prepare(search_query).execute(group[:group_id], yesterday, today)
  body += if result.count == 0
    "誰も活動していないようです...（´・ω・`）\n"
          else
    members_action(result)
          end

  body += "\n今日も頑張って行きましょう！\n"
  body += 'http://mimalab.c.fun.ac.jp/b1013179/scheduler/'

  title = group[:group_name] + 'の昨日のようす'

  p body

  mail.send(subject: title, body: body)
end
