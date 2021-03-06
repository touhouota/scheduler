# 期待したものが入っているか？
# 入っている => true
# 入っていない => false
def _check_data(hope, real)
  # キーに対応した値が入っているか
  values = hope.map do |key|
    # realにkeyがある && reak[key]の大きさが0でない
    # => きちんと値が入っている
    real[key].nil?.! && !real[key].empty?
  end
  if values.include?(false)
    # 指定したkeyを持たない
    return false
  else
    return true
  end
end

# えらー用の文字を返す
def return_error(hope, real)
  { ok: false, message: '期待するデータを送ってくれ', hope: hope, real: real }
end

# ユーザを探す
def search_user(cgi)
  keys = %i[user_id]
  raise '必要な情報が来ていません' unless _check_data(keys, cgi)

  sql = 'select user_id from users where user_id = ?'
  result = $client.prepare(sql).execute(cgi[:user_id])

  { ok: true, data: result.entries.first }
end

# タスク追加
def append_task(cgi)
  keys = %i[user_id task_name date]
  raise '必要な情報が来ていません' unless _check_data(keys, cgi)

  # 実施する日付を追加する
  doing_date = Time.parse(cgi[:date])

  insert = 'insert into daily(task, user_id, doing_date) values(?, ?, ?)'
  $client.prepare(insert).execute(cgi[:task_name], cgi[:user_id], doing_date.strftime('%F %T'))

  search = 'select * from daily where task_id = ? and user_id = ?'
  result = $client.prepare(search).execute($client.last_id, cgi[:user_id])

  # コメントを投稿する
  auto_comment(cgi[:user_id], cgi[:cmd], $client.last_id)

  { ok: true, data: result.entries }
end

# その人のタスクを取得する
def get_task_list(cgi)
  keys = %i[user_id]
  raise '必要な情報が来ていません' unless _check_data(keys, cgi)

  # sql = 'select * from daily where user_id = ? and !(status in (2, 3))'
  # 終わっていないもの or 今日終わらせたものを取得する
  sql = <<-SQL
  select * from daily join users using(user_id) where daily.user_id = ? and
  (
    !(status in (2, 3))
    or
    (
      status in (2, 3)
      and
      date(modify) = date(current_timestamp)
    )
  ) order by task_id desc
  SQL
  list = $client.prepare(sql).execute(cgi[:user_id]).entries

  # JSが理解できる形式の文字列に変換する
  list.each do |row|
    next if row['start_time'].nil?
    time = Time.parse(row['start_time'])
    row['start_time'] = time.strftime('%a %b %d %Y %T GMT%z (%Z)')

    next if row['finish_time'].nil?
    time = Time.parse(row['finish_time'])
    row['finish_time'] = time.strftime('%a %b %d %Y %T GMT%z (%Z)')
  end

  { ok: true, data: list }
end

# タスクの情報を修正する
def task_modify(cgi)
  keys = %i[user_id task_id]
  raise '必要な情報が来ていません' unless _check_data(keys, cgi)

  sql = 'update daily set '
  where = ' where user_id = ? and task_id = ?'
  user_id = cgi[:user_id]
  task_id = cgi[:task_id]
  # task_nameを追加・修正
  $client.prepare(sql + 'task = ?' + where).execute(cgi[:task_name], user_id, task_id) unless cgi[:task_name].nil?
  # statusを修正
  unless cgi[:status].nil?
    raise 'statusの値が不正(0 ~ 4の間にない)' unless cgi[:status].to_i.between?(0, 4)
    $client.prepare(sql + 'status = ?' + where).execute(cgi[:status], user_id, task_id)
  end
  # task_detailを追加・修正
  $client.prepare(sql + 'task_detail = ?' + where).execute(cgi[:task_detail], user_id, task_id) unless cgi[:task_detail].nil?
  # end_detailを修正・追加
  $client.prepare(sql + 'end_detail = ?' + where).execute(cgi[:end_detail], user_id, task_id) unless cgi[:end_detail].nil?
  # hourを追加・修正
  $client.prepare(sql + 'plan = ?' + where).execute(cgi[:plan], user_id, task_id) unless cgi[:plan].nil?
  # timeを修正
  $client.prepare(sql + 'time =  ?' + where).execute(cgi[:time], user_id, task_id) unless cgi[:time].nil?
  # start_timeの修正
  $client.prepare(sql + 'start_time = ?' + where).execute(cgi[:start_time], user_id, task_id) unless cgi[:start_time].nil?

  # 修正した結果を取得する
  search = 'select * from daily where user_id = ? and task_id = ?'
  result = $client.prepare(search).execute(user_id, task_id)
  { ok: true, data: result.entries }
end

# 日付を指定し、その日に登録されているタスクを取得する
def get_list_from_date(cgi)
  keys = %i[user_id date]
  raise '必要な情報が来ていません' unless _check_data(keys, cgi)

  sql = <<-SQL
  select * from daily join (users join groups using(group_id)) using(user_id)
  where group_id in (select group_id from users where user_id = ?) and
  (status in (0,1,4) and doing_date = date(?)) or (status in (2, 3) and finish_time = ?)
  SQL
  date = Time.parse(cgi[:date]).strftime('%F')
  result = $client.prepare(sql).execute(cgi[:user_id], date, date)
  { ok: true, data: result.entries, test: sql }
end

# 状態を指定されたものに変更する
def status_change(cgi)
  keys = %i[user_id status task_id]
  raise '必要な情報が来ていません' unless _check_data(keys, cgi)

  raise 'statusの値が不正(0 ~ 4の間にない)' unless cgi[:status].to_i.between?(0, 4)

  update = 'update daily set status = ? where user_id = ? and task_id = ?'
  $client.prepare(update).execute(cgi[:status], cgi[:user_id], cgi[:task_id])

  # 一時停止時、完了時にはそれまでの経過時間が送られてくるので、それをmodifyへ渡す
  task_modify(cgi) if cgi[:time] || cgi[:start_time]

  search = 'select * from daily where user_id = ? and task_id = ?'
  result = $client.prepare(search).execute(cgi[:user_id], cgi[:task_id])

  # 追加(11/27)
  # タスク終了時、finish_timeにタイムスタンプを打つ。
  if [2, 3].include?(cgi[:status].to_i)
    finishtime_sql = 'update daily set finish_time = ? where user_id = ? and task_id = ?'
    $client.prepare(finishtime_sql).execute(result.entries.dig(0, :modify), cgi[:user_id], cgi[:task_id])
  end

  # コメントを自動投稿する
  auto_comment(cgi[:user_id], cgi[:cmd], cgi[:task_id])

  { ok: true, data: result.entries }
end

def get_timeline(cgi)
  keys = %i[user_id]
  raise '必要な情報が来ていません' unless _check_data(keys, cgi)

  # last => コメントエリアに流れている最後のtl_id
  # lastがあるときは、定期的に取得するとき
  # lastがないときは、onload時
  result = nil
  if cgi[:last].nil?
    sql = <<-SQL
      select tl_id ,timeline.user_id, name, items, datetime, gj
      from timeline join users using(user_id)
      where group_id = (select group_id from users where user_id = ?)
      order by tl_id desc limit 20
    SQL
    result = $client.prepare(sql).execute(cgi[:user_id]).entries.reverse
  else
    last = cgi[:last].to_i
    sql = <<-SQL
      select tl_id, timeline.user_id, name, items, datetime, gj
      from timeline join users using(user_id)
      where timeline.user_id = users.user_id and tl_id > ?
      and group_id = (select group_id from users where user_id = ?)
      order by tl_id desc
    SQL
    result = $client.prepare(sql).execute(cgi[:last], cgi[:user_id]).entries
  end

  # 日付をJSが理解できる形式にする
  result.each do |item|
    item[:datetime] = item[:datetime].strftime('%a %b %d %Y %T GMT%z (%Z)')
  end

  { ok: true, data: result }
end

# コメントを投稿する
def insert_timeline(cgi)
  keys = %i[user_id comment]
  raise '必要な情報が来ていません' unless _check_data(keys, cgi)

  sql = <<-SQL
  insert into timeline(user_id, items) values(?, ?)
  SQL
  $client.prepare(sql).execute(cgi[:user_id], cgi[:comment])

  search = <<-SQL
  select * from timeline join users using(user_id) where tl_id = ?
  SQL
  result = $client.prepare(search).execute($client.last_id)
  { ok: true, data: result.entries }
end

# 自動でタイムラインにコメントを投稿するためのメソッド
# input:user_id, cmd, task_id
def auto_comment(user_id, cmd, task_id)
  sql = 'select * from daily join users using(user_id) where user_id = ? and task_id = ?'
  result = $client.prepare(sql).execute(user_id, task_id).entries.first
  comment = "#{result[:name]}は、「#{result[:task]}」を"
  comment += case cmd
             when 'append_task'
              '追加しました。'
             when 'status_change'
              case result[:status]
              when 1
                'はじめました。'
              when 2
                '完了しました。'
              when 3
                '目標まで到達しませんでした。'
              when 4
                '一旦やめました。'
              end
             end
  # 実際にコメントを投稿する
  hash = { user_id: user_id, comment: comment }
  insert_timeline(hash)
end

# 日付指定してタスクリストを取得する
# 古いものをそのまましようする。削除すべき(記：2017-10-30)
# def get_list_from_date(cgi)
#   keys = %i[user_id date]
#   raise "必要な情報が来ていません" unless _check_data(keys, cgi)
#
#   g_id_sql = 'select group_id from users where user_id = ?'
#   group_id = $client.prepare(g_id_sql).execute(cgi[:user_id]).first[:group_id]
#   sql = 'select * from daily join users using(user_id) where created = ? and group_id = ? order by user_id'
#   result = $client.prepare(sql).execute(cgi[:date], group_id)
#
#   hash = { ok: true, data: result.entries }
#   hash
# end
