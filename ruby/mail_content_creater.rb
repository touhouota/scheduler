require 'date'
require 'yaml'

def count_down(group_name)
  csv_options = {
    headers: true,
    header_converters: :symbol,
    encoding: Encoding::UTF_8
  }

  body = ''

  today = Date.today

  # ファイルが存在しない時は、無視
  file_path = "./plan/#{group_name}.yaml"
  return '' unless File.exist?(file_path)
  plan_list = YAML.load_file(file_path)
  # ファイルが有るならば、読み込む
  plan_list.each do |row|
    case (row[:date] - today).to_i
    when -Float::INFINITY..-1
      next
    when 0
      body << "・「#{row[:plan]}」当日。お疲れ様！！\n"
      body << "\n"
    else
      body << "・「#{row[:plan]}」まで、あと#{(row[:date] - today).to_i}日。\n"
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

def members_action(group)
  # グループに属している人のTL内容を取得
  search_query = <<-SQL
  select *, task_timeline.status as tl_status from task_timeline join (task join users using(user_id)) using(task_id, user_id)
  where users.group_id = ? and
  task_timeline.status in (0, 2, 3) and
  date(task_timeline.created) between
    date(date_sub(current_timestamp, interval 1 day))
    and
    date(date_add(current_timestamp, interval 1 day))
  SQL

  result = $client.prepare(search_query).execute(group[:group_id])
  # もし、作業の情報がなければ、その段階で処理を終える。
  return '誰も作業じていないようです。＼(^o^)／< 大丈夫か？？？' if result.size.zero?

  # TLから各ユーザのタスク追加・実行状況を計測
  users = result.each_with_object({}) do |entry, hash|
    hash[entry[:name]] = { tasks: 0, fin: 0 } unless hash.dig(entry[:name])
    # ユーザ名を数える => その日のタスク数がわかる
    hash[entry[:name]][:tasks] += 1 if entry[:tl_status] == 0
    # statusが2のものを数える => 完了した数がわかる
    hash[entry[:name]][:fin] += 1 if [2, 3].include?(entry[:tl_status])
  end

  content = ''

  users.each do |user, info|
    content << "#{user}の活動\n"
    content << '=>'
    content << "新しく#{info[:tasks]}個のタスクを登録し、" if info[:tasks].zero? == false
    content << "#{info[:fin]}個を終わらせました！\n\n"
  end

  # content << "Debug: tl_size => #{result.size}\n"
  # result.each do |item|
  #   content << "#{item[:task_name]}, #{item[:name]}, #{item[:status]} \n"
  # end
  # content << '------------------------------'
  # content << users.to_s

  content
end
