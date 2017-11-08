# coding: utf-8

# ユーザを探す
def search_user(db, cgi)
  result = db.query("select user_id from users where user_id = '#{cgi["user_id"]}'")
  hash = {ok: true, data: result.entries.first, test: result.entries.first.to_s}
  return hash
end

# ユーザを作成する
def create_user(db, cgi)
  db.query("insert into users(user_id) values('#{cgi["user_id"]}')")
  user_id = db.query("select user_id from users where user_id = '#{cgi["user_id"]}'")
  hash = user_id.entries.first
  result = {ok: true, data: hash}
  return result
end

# データをDBへ保存
def insert(db, cgi)
  state = db.prepare("insert into daily(user_id, hour, status, task, task_detail, date) value(?, ?, ?, ?, ?, ?)")
  json = JSON.parse(cgi["data"] || cgi[:data], symbolize_names: true)
  # json["list"].each do |form|
  #   state.execute(json["user_id"], form["hour"], form["status"], form["task"], form["detail_text"], json["date"])
  # end
  json[:list].each do |form|
    state.execute(json[:user_id], form[:hour], form[:status], form[:task], form[:detail_text], json[:date])
  end
  hash = {ok: true, data: cgi["data"] || cgi[:data]}
  return hash
end

# 名前のみでタスクを追加する
def add_task_name(db, cgi)
  # タスク名だけでタスクを追加
  sql = "insert into daily(user_id, task, date) value(?, ?, ?)"
  state = db.prepare(sql)
  state.execute(cgi["user_id"], cgi["task"], cgi["date"])

  # 追加したタスクを取得し返す
  sql = "select * from daily "\
        "where task = ? and user_id = ? "\
        "order by task_id desc"
  state = db.prepare(sql)
  result = state.execute(cgi["task"], cgi["user_id"]).first
  hash = {ok: true, data: [result]}
  return hash
end

# タスクの情報を修正・追加する
def modify_info(db, cgi)
  sql = "update daily set "
  where = " where user_id = '#{cgi["user_id"]}' and task_id = #{cgi["task_id"]}"
  # task_nameを追加・修正
  db.query(sql + "task = '#{cgi["task_name"]}'" + where) unless cgi["task_name"].empty?
  # statusを修正
  db.query(sql + "status = #{cgi["status"]}" + where) unless cgi["status"].empty?
  # task_detailを追加・修正
  db.query(sql + "task_detail = '#{cgi["task_detail"]}'" + where) unless cgi["task_detail"].empty?
  # end_detailを修正・追加
  db.query(sql + "end_detail = '#{cgi["end_detail"]}'" + where) unless cgi["end_detail"].empty?
  # hourを追加・修正
  db.query(sql + "hour = #{cgi["hour"]}" + where) unless cgi["hour"].empty?
  # timeを修正
  db.query(sql + "time = #{cgi["time"]}" + where) unless cgi["time"].empty?

  # sql = "select * from daily where task_id = #{cgi["task_id"]}"
  sql = "select * from daily, users where daily.user_id = users.user_id and task_id = #{cgi["task_id"]}"
  result = db.query(sql).entries
  chart_data = create_chart_json(db, result.first["date"], cgi["user_id"])
  hash = {ok: true, data: result, chart: chart_data}
  return hash
end

# 今日の一覧を取得する
def list(db, cgi)
  # sql = "select * from daily where user_id = '#{cgi["user_id"]}' and date = '#{cgi["date"]}'"
  # sql = "select * from daily where user_id = ? and status != 2"
  sql = "select * from daily where user_id = ? and date = ?"
  result = {}
  chart = create_chart_json(db, cgi["date"], cgi["user_id"])
  list = db.prepare(sql).execute(cgi["user_id"], cgi["date"]).entries
  
  # JSが理解できる形式の文字列に変換する
  list.each do |row|
    next if row["start_time"].nil?
    time = Time.parse(row["start_time"])
    row["start_time"] = time.strftime("%a %b %d %Y %T GMT%z (%Z)")
    
    next if row["finish_time"].nil?
    time = Time.parse(row["finish_time"])
    row["finish_time"] = time.strftime("%a %b %d %Y %T GMT%z (%Z)")
  end

  result.store("ok", true)
  result.store("list", list)
  result.store("chart", chart)
  
  # タスクがないとき、昨日のタスクから引き継ぐ
  if list.length == 0 then
    handover = handover(db, cgi)
    result.store("handover", handover)
    insert(db, handover)
    result.store("list", JSON.parse(handover[:data])["list"])
  end
  return result
end


def end_task(db, cgi)
  json = JSON.parse(cgi["data"], symbolize_names: true)
  task_id = ""
  json["form"].each do |line|
    db.query("update daily set status = #{line[:status]}, end_detail = '#{line[:end_detail]}' where task_id = #{line[:task_id]}")
    task_id = line["task_id"]
  end
  date = db.query("select date from daily where task_id = #{task_id}").entries.first["date"]
  hash = {ok: true, data: cgi["data"], chart: create_chart_json(db, date, json["user_id"])}
  return hash
end

# タスク完了時の処理
def finish_task(db, cgi)
  sql = "update daily set "\
        "status = ?,"\
        "end_detail = ?,"\
        "time = ? "\
        "where user_id = ? and task_id = ?"
  state = db.prepare(sql)
  state.execute(cgi["status"], cgi["end_detail"], cgi["time"], cgi["user_id"], cgi["task_id"])
  sql = "select date from daily where task_id = #{cgi["task_id"]}"
  date = db.query(sql).entries.first["created"]
  result = db.query("select * from daily where task_id = #{cgi["task_id"]}")
  hash = {ok: true, data: result.entries, chart: create_chart_json(db, date, cgi["user_id"])}
  # コメントを投稿
  timeline_send(db, cgi)
  
  return hash
end

# 日付指定してタスクリストを取得する
def get_list_from_date(db, cgi)
  g_id_sql = "select group_id from users where user_id = '#{cgi["user_id"]}'"
  group_id = db.query(g_id_sql).first["group_id"]
  sql = "select * from daily join users using(user_id) where daily.user_id = users.user_id and date = ? and group_id = '#{group_id}' order by user_id"
  task_list = db.prepare(sql)
  result = task_list.execute(cgi["date"])
  if(cgi["mine"].empty?.!) then
    # mine.empty?.!がtrueの時はmineがない時 => 自分のデータだけ
    result = result.select {|row| row["user_id"] == cgi["user_id"]}
  else
    # ユーザIDごとに分ける
    # group_byは指定したものの配列を作る
    # result = result.group_by{|row| row["user_id"]}
    result = result.entries
  end
  chart = create_chart_json(db, cgi["date"], cgi["user_id"])
  hash = {ok: true, data: result, chart: chart}
  return hash
end

def get_task_on_week(db, cgi)
  state = db.prepare("select * from daily where user_id = ? and date between ? and ?")
  result = state.execute(cgi["user_id"], cgi["start"], cgi["end"])
  hash = {ok: true, data: result.entries}
  return hash
end

# 進捗更新時
def time_store(db, cgi)
  if(1 == cgi["status"].to_i) then
    db.query("update daily set start_time = '#{Time.now.to_s}', status = #{cgi["status"]} where task_id = #{cgi["task_id"]}")
  elsif((2..3).include?(cgi["status"].to_i)) then
    db.query("update daily set finish_time = '#{Time.now.to_s}', status = #{cgi["status"]} where task_id = #{cgi["task_id"]}")
  elsif(4 == cgi["status"].to_i) then
    sql = "update daily "\
          "set time = ?, status = ?, end_detail = ? "\
          "where task_id = ? and user_id = ?"
    state = db.prepare(sql)
    state.execute(cgi["time"], cgi["status"], cgi["end_detail"],cgi["task_id"], cgi["user_id"])
  end
  # コメントを投稿
  timeline_send(db, cgi)
  result = db.query("select * from daily where task_id = #{cgi["task_id"]} ").entries
  chart_data = create_chart_json(db, result.first["date"], cgi["user_id"])
  hash = {ok: true, data: result, chart: chart_data}
  return hash
end

def timeline_get(db, cgi)
  # last => コメントエリアに流れている最後のtl_id
  # lastがあるときは、定期的に取得するとき
  # lastがないときは、onload時
  if(cgi["last"].empty?) then
    sql = "select tl_id ,timeline.user_id, name, items, datetime, gj "\
          "from timeline "\
          "join users using(user_id) "\
          "where group_id = (select group_id from users where user_id = '#{cgi['user_id']}') "\
          "order by tl_id desc limit 20"
    result = db.query(sql)
    hash = {ok: true, data: result.entries.reverse, test: result.entries.to_s}
  else
    last = cgi["last"].to_i;
    sql = "select tl_id, timeline.user_id, name, items, datetime, gj "\
          "from timeline "\
          "join users using(user_id) "\
          "where timeline.user_id = users.user_id and tl_id > ? "\
          "and group_id = (select group_id from users where user_id = '#{cgi['user_id']}') "\
          "order by tl_id desc"
    state = db.prepare(sql)
    result = state.execute(last)
    # result = db.query("select * from timeline where tl_id > #{last} order by tl_id desc")
    hash = {ok: true, data: result.entries.reverse}
  end
  return hash
end

def timeline_send(db, cgi)
  state = db.prepare("insert into timeline(datetime, user_id, items) values(?, ?, ?)")
  comment = nil
  unless((status = cgi["status"].to_i).zero?) then
    # 0でない時、進捗更新の時
    status_array = ["", "を始めた", "を終了した", "が目標まで到達しなかった", "を一旦止めた"]
    name = db.query("select name from users where user_id = '#{cgi["user_id"]}'").entries.first["name"]
    task = db.query("select task from daily where task_id = '#{cgi["task_id"]}'").entries.first["task"]
    comment = "#{name}は「#{task}」#{status_array[status]}"
    state.execute(cgi["datetime"], cgi["user_id"], comment)
  else
    # 0の時は、statusは文字列→コメント投稿
    state.execute(cgi["datetime"], cgi["user_id"], cgi["comment"])
  end
  # 登録されたコメントの取得
  # コメント内容と同じもののうち、最新のもの1つのみを追加
  sql = "select tl_id, timeline.user_id, name, items, datetime, gj "\
        "from timeline join users using(user_id) "\
        "where users.user_id = ? "\
        "order by tl_id desc limit 1"
        # "and items = ? "\
  return_comment = db.prepare(sql)
  # result = return_comment.execute(cgi["user_id"], cgi["comment"])
  result = return_comment.execute(cgi["user_id"])
  return {ok: true, data: result.entries, name: name}
end

# 更新を行う
# test_scheduler用のメソッド
def update_state(db, cgi)
  if(cgi["status"].to_i >= 2) then
    update = db.prepare("update daily set status = ?, start_time = ? where user_id = ? and task_id = ?")
    update.execute(cgi["status"], Time.now, cgi["user_id"], cgi["task_id"])
  elsif(cgi["status"].to_i == 1) then
    update = db.prepare("update daily set status = ?, start_time = ?, end_detail = ? where user_id = ? and task_id = ?")
    update.execute(cgi["status"], Time.now, cgi["end_detail"], cgi["user_id"], cgi["task_id"])
  end
  sql = "select * from daily where task_id = #{cgi["task_id"]}"
  result = db.query(sql)
  hash = {ok: true, data: result.entries}
  return hash
end


###########################
# グラフを作るためのJSONを作る
###########################
def create_chart_json(db, date, user_id)
  hash, plan, real = {}, [], []
  result = db.query("select task, hour, start_time, finish_time, time from daily where date = '#{date}' and user_id = '#{user_id}'")
  result.each do |line|
    start = (line["start_time"].nil?) ? 0 : Time.parse(line["start_time"])
    finish = (line["finish_time"].nil?) ? 0 : Time.parse(line["finish_time"])
    plan.push(line["hour"])
    # 予想時間を配列にする
    # plan.push(plan_time(line["hour"]))
    # 実際の時間を計算
    if(line["time"].nil?) then
      # timeがないときは、終了時間から開始時間を引く
      if(finish.class == start.class) then
        real.push((finish - start) / 60)
      else
        real.push(0)
      end
    else
      # timeがあるときは、それを入れる
      real.push(line["time"].to_i / 60)
    end
  end
  hash.store("data", {plan: plan, real: real})
  return hash
end

def plan_time(hour)
  return 0 if hour.nil?
  hour
end

# 前日のタスクを引き継ぐ
def handover(db, cgi)
  # 昨日の日付を取得
  yesterday = DateTime.parse(cgi["date"]) - 1
  # 昨日のタスクから、完了していないものを取得する
  sql = "select * from daily where user_id = '#{cgi["user_id"]}' and status != 2 and date = '#{yesterday.strftime('%Y-%m-%d')}'"
  result = db.query(sql).map do |hash|
    hash["task"] = "Re:#{hash["task"]}"
    hash["task_detail"] = "昨日未達成だったもの。\n以下、昨日の詳細を引用。\n\n#{hash["task_detail"]}"
    hash["detail_text"] = hash["task_detail"]
    hash["time"] = 0
    hash["status"] = 0
    hash
  end
  insert_hash = {"data": JSON.generate({"list": result.entries, "user_id": cgi["user_id"], "date": cgi["date"]})}
  return insert_hash
end
