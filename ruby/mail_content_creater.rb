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
  content = ''
  timeline.each do |item|
    content << item[:task_name].to_s << "\n"
  end
  content
end
