#!/usr/local/Ruby/bin/ruby

require 'cgi'
require 'json'
require 'mysql2'
require 'uri'
require 'time'
load './self.rb'

print "Content-Type: text/plain;charset=utf-8\n\n"

client = Mysql2::Client.new(host: 'localhost', username: 'research', password: 'do_research', encoding: 'utf8', database: 'do_research')
cgi = CGI.new

begin
  result = case cgi['cmd']
           when 'exist'
    # ログイン時の処理、ユーザが存在するか
    search_user(client, cgi)
           when 'create'
    # ログイン時の処理、ユーザの作成
    create_user(client, cgi)
           when 'insert'
    insert(client, cgi)
           when 'name_only'
    add_task_name(client, cgi)
           when 'list'
    cgi.params.store('date', [Time.now.strftime('%Y-%m-%d')])
    list(client, cgi)
           when 'modify'
    modify_info(client, cgi)
           when 'finish'
    # 古い、使わないので消す予定
    end_task(client, cgi)
           when 'finish_task'
    finish_task(client, cgi)
           when 'date'
    get_list_from_date(client, cgi)
           when 'week_task'
    get_task_on_week(client, cgi)
           when 'time'
    time_store(client, cgi)
           when 'tl_get'
    timeline_get(client, cgi)
           when 'tl_send'
    timeline_send(client, cgi)
           when 'update'
    # d_and_dよう
    update_state(client, cgi)
           else
    { ok: false, data: 'not command', cgi: cgi.params }
  end
  print JSON.generate(result)
rescue => e
  client.query('rollback')
  client.query('commit')
  file = open('../error', 'a')
  file.write("#{e.class}\n")
  file.write("#{Time.now}\n")
  file.write(e.message + "\n")
  file.write(e.backtrace.join("\n"))
  file.write(cgi['list'] + "\n")
  file.write("\n\n")
  file.close
  json = {}
  json.store('ok', false)
  json.store('data', e.inspect.to_s)
  json.store('path', e.backtrace.join('/n'))
  json.store('cgi', cgi.params)
  print JSON.generate(json)
end
