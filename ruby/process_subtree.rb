
$error_string = 'Unexpected Data: Please send the expected data.'
$range_error = 'Unexpected Data: status value should be between "0" and "4"'

# 期待したものが入っているか？
# 入っている => true
# 入っていない => false
def _check_data(hope, real)
  # キーに対応した値が入っているか
  values = hope.map do |key|
    # realにkeyがある && reak[key]の大きさが0でない
    # => きちんと値が入っている
    real[key].nil?.! && !real[key].to_s.empty?
  end
  if values.include?(false)
    # 指定したkeyを持たない
    return false
  else
    return true
  end
end

# ユーザを探す
def search_user(cgi)
  keys = %i[user_id]
  raise '' unless _check_data(keys, cgi)

  sql = 'select user_id from users where user_id = ?'
  result = $client.prepare(sql).execute(cgi[:user_id])

  { ok: true, data: result.entries.first }
end

# タスク追加
def append_task(cgi)
  keys = %i[user_id task_name date]
  raise $error_string + ' (append_task)' unless _check_data(keys, cgi)

  # 実施する日付を追加する
  doing_date = Time.parse(cgi[:date])
  # insert = 'insert into daily(task, user_id, doing_date) values(?, ?, ?)'
  insert = 'insert into task(task_name, user_id, start_date) values(?, ?, ?)'
  $client.prepare(insert).execute(cgi[:task_name], cgi[:user_id], doing_date.strftime('%F %T'))

  search = 'select * from task where task_id = ? and user_id = ?'
  result = $client.prepare(search).execute($client.last_id, cgi[:user_id])

  cgi[:task_id] = $client.last_id.to_s
  task_modify(cgi) if cgi[:plan]

  # コメントを投稿する
  auto_comment(cgi[:user_id], cgi[:cmd], cgi[:task_id])

  # タスクタイムラインにも追加
  cgi[:status] = '0' # タスク追加時は、状態が0
  insert_task_tl(cgi)

  { ok: true, data: result.entries, test: cgi }
end

# サブタスクを追加する
def append_subtask(cgi, task_info)
  key = %i[user_id parent]
  raise $error_string + ' (append_subtask)' unless _check_data(key, cgi)

  parent_id = task_info.dig(:data, 0, :task_id)
  subtask_sql = 'insert into task_tree values(?, ?)'
  $client.prepare(subtask_sql).execute(cgi[:parent], parent_id)

  sql = <<-SQL
  select * from task left outer join task_tree on task.task_id = task_tree.child
  where user_id = ? and task.task_id = ?
  SQL
  result = $client.prepare(sql).execute(cgi[:user_id], parent_id)

  { ok: true, data: result.entries }
end

# その人のタスクを取得する
def get_task_list(cgi)
  keys = %i[user_id]
  raise $error_string + ' (get_task_list)' unless _check_data(keys, cgi)

  sql = <<-SQL
  select * from task join users using(user_id) left outer join task_tree on task.task_id = task_tree.child
  where task.user_id = ? and
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
    # タスクタイムラインの、最後のものがそのタスクの最終状態。
    task_tl_search = 'select * from task_timeline where user_id = ? and task_id = ? order by task_tl_id desc limit 1'
    # 最後のものを取得
    last_tl = $client.prepare(task_tl_search).execute(row[:user_id], row[:task_id]).entries.last
    # 1でないものは実行中でないので無視
    next if last_tl.nil? || last_tl[:status] != 1

    # 最後のものの作成時間が開始時間
    row[:start_time] = last_tl[:created].strftime('%a %b %d %Y %T GMT%z (%Z)')
  end

  { ok: true, data: list }
end

# タスクの親だけを取得する
def get_task_parent(cgi)
  keys = %i[user_id]
  raise $error_string + ' (get_task_parent)' unless _check_data(keys, cgi)

  sql = <<-SQL
  select * from task left outer join task_tree on task_id = child where (user_id = ? and parent is null)
  SQL

  result = $client.prepare(sql).execute(cgi[:user_id])

  { ok: true, data: result.entries, length: result.entries.length }
end

def get_task_child(cgi)
  keys = %i[user_id parent]
  raise $error_string + ' (get_task_child)' unless _check_data(keys, cgi)

  sql = <<-SQL
  select * from task left outer join task_tree on task_id = child where (user_id = ? and parent = ?)
  SQL

  result = $client.prepare(sql).execute(cgi[:user_id], cgi[:parent])
  { ok: true, data: result.entries, length: result.entries.length }
end

# タスクの情報を修正する
def task_modify(cgi)
  keys = %i[user_id task_id]
  raise $error_string + ' (task_modify)' unless _check_data(keys, cgi)

  # sql = 'update daily set '
  sql = 'update task set '
  where = ' where user_id = ? and task_id = ?'
  user_id = cgi[:user_id]
  task_id = cgi[:task_id]
  # task_nameを追加・修正
  $client.prepare(sql + 'task_name = ?' + where).execute(cgi[:task_name], user_id, task_id) unless cgi[:task_name].nil?
  # statusを修正
  unless cgi[:status].nil? || cgi[:status].empty?
    raise $range_error unless cgi[:status].to_i.between?(0, 4)
    $client.prepare(sql + 'status = ?' + where).execute(cgi[:status], user_id, task_id)
  end
  # task_detailを追加・修正
  $client.prepare(sql + 'memo = ?' + where).execute(cgi[:task_detail], user_id, task_id) unless cgi[:task_detail].nil? || cgi[:task_detail].to_s.empty?
  # end_detailを修正・追加
  $client.prepare(sql + 'reflection = ?' + where).execute(cgi[:end_detail], user_id, task_id) unless cgi[:end_detail].nil? || cgi[:end_detail].to_s.empty?
  # hourを追加・修正
  $client.prepare(sql + 'expected_time = ?' + where).execute(cgi[:plan], user_id, task_id) unless cgi[:plan].nil? || cgi[:plan].to_s.empty?
  # timeを修正
  $client.prepare(sql + 'actual_time =  ?' + where).execute(cgi[:time], user_id, task_id) unless cgi[:time].nil? || cgi[:time].to_s.empty?

  # 親タスクの時は、parent_id=自分自身
  # 子タスクの時は、parent_id=親のID
  parent_id = if cgi[:parent].to_s.empty?
    cgi[:task_id]
              else
    cgi[:parent]
              end

  # 修正した結果を取得する
  search = 'select * from task left outer join task_tree on task_id = child where user_id = ? and (task_id = ? or parent = ?) order by task_id'
  # サブタスクを取得する
  result = $client.prepare(search).execute(user_id, parent_id, parent_id)
  { ok: true, data: result.entries }
end

# 日付を指定し、その日に登録されているタスクを取得する
def get_list_from_date(cgi)
  keys = %i[user_id date]
  raise $error_string unless _check_data(keys, cgi)

  # sql = <<-SQL
  # select * from daily join (users join groups using(group_id)) using(user_id)
  # where group_id in (select group_id from users where user_id = ?) and
  # (status in (0,1,4) and doing_date = date(?)) or (status in (2, 3) and finish_time = ?)
  # SQL
  sql = <<-SQL
  select * from task join (users join groups using(group_id)) using(user_id)
  where group_id in (select group_id from users where user_id = ?)
  and (status in (0,1,4) and date(start_date) = ?) or (status in (2, 3) and date(modify) = ?)
  SQL
  date = Time.parse(cgi[:date]).strftime('%F')
  result = $client.prepare(sql).execute(cgi[:user_id], date, date)
  { ok: true, data: result.entries, test: sql }
end

# 状態を指定されたものに変更する
def status_change(cgi)
  keys = %i[user_id status task_id]
  raise $error_string unless _check_data(keys, cgi)

  raise $range_error unless cgi[:status].to_i.between?(0, 4)
  # update = 'update daily set status = ? where user_id = ? and task_id = ?'
  update = 'update task set status = ? where user_id = ? and task_id = ?'
  $client.prepare(update).execute(cgi[:status], cgi[:user_id], cgi[:task_id])

  # 一時停止時、完了時にはそれまでの経過時間が送られてくるので、それをmodifyへ渡す
  task_modify(cgi) if cgi[:time] || cgi[:start_time]

  # search = 'select * from daily where user_id = ? and task_id = ?'
  search = 'select * from task where user_id = ? and task_id = ?'
  result = $client.prepare(search).execute(cgi[:user_id], cgi[:task_id])

  # タスクを更新するたびに、状態をタスクタイムラインに追加する
  insert_task_tl(cgi)

  # コメントを自動投稿する
  auto_comment(cgi[:user_id], cgi[:cmd], cgi[:task_id])

  { ok: true, data: result.entries }
end

# タスクタイムラインに状態を保持する
def insert_task_tl(cgi)
  keys = %i[task_id user_id status]
  raise $error_string unless _check_data(keys, cgi)

  sql = 'insert into task_timeline(task_id, user_id, status) values(?, ?, ?)'
  $client.prepare(sql).execute(cgi[:task_id], cgi[:user_id], cgi[:status])
end

def get_timeline(cgi)
  keys = %i[user_id]
  raise $error_string unless _check_data(keys, cgi)

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
  raise $error_string unless _check_data(keys, cgi)

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
  # sql = 'select * from daily join users using(user_id) where user_id = ? and task_id = ?'
  sql = 'select * from task join users using(user_id) where user_id = ? and task_id = ?'
  result = $client.prepare(sql).execute(user_id, task_id).entries.first
  # comment = "#{result[:name]}は、「#{result[:task]}」を"
  comment = "#{result[:name]}は、「#{result[:task_name]}」を"
  comment += case cmd
             when 'append_task'
              '追加しました。'
             when 'append_subtask'
              'サブタスクとして追加しました。'
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
