require 'time'
require './mail'
require 'mysql2'

def count_down(group_name)
  require 'csv'
  require 'date'
  csv_options = {
    headers: true,
    header_converters: :symbol,
    encoding: Encoding::UTF_8
  }

  body = ''

  today = Date.today

  # ファイルが存在しない時は、無視
  return '' unless File.exist?("./plan/#{group_name}.csv")

  # ファイルが有るならば、読み込む
  CSV.foreach("./plan/#{group_name}.csv", csv_options) do |row|
    date = Date.parse(row[:date])
    case (date - today).to_i
    when -Float::INFINITY..-1
      next
    when 0
      body << "・「#{row[:plan]}」当日。お疲れ様！！\n"
      body << "  予定通りに活動できたかな？振り返ってみよう。\n"
      body << "\n"
    when 1..7
      body << "・「#{row[:plan]}」まで、あと#{(date - today).to_i}日。\n"
      body << "  一週間を切りました、もうそろそろ最終チェックも終わっている頃？\n"
      body << "\n"
    when 8..14
      body << "・「#{row[:plan]}」まで、あと#{(date - today).to_i}日。\n"
      body << "  日数的には余裕ありそうだけど、その間にどれだけ活動できるか考えてみよう。\n"
      body << "\n"
    when 15..30
      body << "・「#{row[:plan]}」まで、あと#{(date - today).to_i}日。\n"
      body << "  1ヶ月とかあっという間。予定は立てたかな？\n"
      body << "\n"
    else
      body << "・「#{row[:plan]}」まで、あと#{(date - today).to_i}日。\n"
      body << "\n"
    end
  end

  return '' if body.length.zero?

  <<"EOS"
-------------------------------------------
予定をお知らせします。

#{body}
-------------------------------------------


EOS
end

######
# main
######

client = Mysql2::Client.new(host: 'localhost', username: 'planner', password: 'plan_manager', encoding: 'utf8', database: 'planner')
# デフォルトでkeyをsymbolにする
client.query_options[:symbolize_keys] = true

sql = <<-SQL
select * from groups
SQL

client.query(sql).each do |group|
  # mailアドレスが設定されていない場合は無視する
  next if group[:mail].nil?
  # メールアドレスが設定されているグループには、そこあてにメールを送る
  mail = SendMail.new(to: '2017math@sketch.jp', from: 'planner@sketch.jp', bcc: ['g2117034@fun.ac.jp'], option: { server: 'po.sketch.jp', port: 587, ssl: false })
  # グループに属している人のTL内容を
  search_query = <<-SQL
  select * from timeline where auto = 1 and
  user_id in (select user_id from user_group where group_id = ?) and
  date between
    date(date_sub(current_timestamp, interval 1 day))
    and
    date(date_add(current_timestamp, interval 1 day))
  SQL

  body = count_down(group[:group_name])

  body += "昨日の#{group[:group_name]}の様子は以下の通りでした。\n\n"
  result = client.prepare(search_query).execute(group[:group_id])
  if result.count == 0
    body += "誰も活動していないようです...（´・ω・`）\n"
  else
    result.each do |comment|
      body += comment[:date].strftime('%F %T') + "\n"
      body += comment[:comment] + "\n"
    end
  end

  body += "\n今日も頑張って行きましょう！\n"
  body += 'http://mimalab.c.fun.ac.jp/planner/'

  title = group[:group_name] + 'の昨日のようす'

  mail.send(subject: title, body: body)
end
