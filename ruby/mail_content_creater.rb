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
  return '' unless File.exist?("./plan/#{group_name}.csv")

  # ファイルが有るならば、読み込む
  CSV.foreach("./plan/#{group_name}.csv", csv_options) do |row|
    date = Date.parse(row[:date])
    case (date - today).to_i
    when -Float::INFINITY..-1
      next
    when 0
      body << "・「#{row[:plan]}」当日。お疲れ様！！\n"
      body << "\n"
    when 1..7
      body << "・「#{row[:plan]}」まで、あと#{(date - today).to_i}日。\n"
      body << "\n"
    when 8..14
      body << "・「#{row[:plan]}」まで、あと#{(date - today).to_i}日。\n"
      body << "\n"
    when 15..30
      body << "・「#{row[:plan]}」まで、あと#{(date - today).to_i}日。\n"
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

def members_action(timeline)
  # TLから各ユーザのタスク追加・実行状況を計測
  users = timeline.each_with_object({}) do |entry, hash|
  hash[entry[:name]] = { tasks: 0, fin: 0 } unless hash.dig(entry[:name])
  p entry
  # ユーザ名を数える => その日のタスク数がわかる
  hash[entry[:name]][:tasks] += 1 if entry[:status] == 0
  # statusが2のものを数える => 完了した数がわかる
  hash[entry[:name]][:fin] += 1 if [2, 3].include?(entry[:status])
  end

  content = ''

  users.each do |user, info|
    content << "#{user}の活動\n"
    content << "=>新しく#{info[:tasks]}個のタスクを登録し、#{info[:fin]}個を終わらせました！\n\n"
  end

  # content << "Debug: tl_size => #{timeline.size}\n"
  # timeline.each do |item|
  #   content << "#{item} \n"
  # end

  content
end
