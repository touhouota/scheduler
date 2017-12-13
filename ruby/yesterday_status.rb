require 'mysql2'
require 'date'
require 'yaml'
require './mail'
require './mail_content_creater'

######
# main
######

$client = Mysql2::Client.new(YAML.load_file('./database_info.yaml'))
# デフォルトでkeyをsymbolにする
$client.query_options[:symbolize_keys] = true

$client.query('select * from groups').each do |group|
  # mailアドレスが設定されていない場合は無視する
  next if group[:mail].nil?
  # メールアドレスが設定されているグループには、そこあてにメールを送る
  mail = SendMail.new(to: group[:mail], from: 'scheduler@sketch.jp', option: { server: 'po.sketch.jp', port: 587, ssl: false })

  # 予定を出力
  body = count_down(group[:group_name])

  # 導入
  body += "昨日の#{group[:group_name]}の様子は以下の通りでした。\n\n"

  # メンバーの取り組みをもとに文言を作成
  body += members_action(group)

  body += "\n今日も頑張って行きましょう！\n"
  body += 'http://mimalab.c.fun.ac.jp/b1013179/scheduler/'

  title = group[:group_name] + 'の昨日のようす - スケジューラ'

  mail.send(subject: title, body: body)
end
