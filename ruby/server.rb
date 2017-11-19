#!/usr/local/Ruby/bin/ruby
require 'cgi'
require 'json'
require 'mysql2'
require 'uri'
require 'time'
require 'yaml'
load './process.rb'

print "Content-Type: text/plain;charset=utf-8\n\n"

begin
  $client = Mysql2::Client.new(YAML.load_file('./database_info.yaml'))
  # デフォルトでkeyをsymbolにする
  $client.query_options[:symbolize_keys] = true

  cgi = CGI.new
  # cgiをハッシュに変換する
  cgi = cgi.params.map { |key, value| [key.intern, value.first] }.to_h
  # p cgi

  # トランザクションの開始
  $client.query('BEGIN')

  # メインとなる分岐
  result = case cgi[:cmd]
           when 'exist'
            search_user(cgi)

           when 'append_task'
             append_task(cgi)

           when 'task_list'
             get_task_list(cgi)

           when 'task_modify'
             task_modify(cgi)

           when 'date'
             get_list_from_date(cgi)

           when 'status_change'
             status_change(cgi)

           when 'get_timeline'
             get_timeline(cgi)

           when 'insert_timeline'
             insert_timeline(cgi)

          #  when 'date'
          #    # TODO: メンバーの様子を見せるメソッドの書き換え
          #    # 現状の方針では、日付ベースではなく個人ごとにすべきだと思う
          #    get_list_from_date(cgi)

           else
             { ok: false, data: cgi, message: 'そんなのないよ' }
  end
  # トランザクションの終了
  $client.query('COMMIT')
  # クライアントへと返す
  print JSON.generate(result)
rescue => e
  # errorが起こった時は、なかったコトにする
  $client.query('ROLLBACK')

  # errorの時は、エラー内容と実際のcgiを返す
  response = {
    ok: false,
    data: e.inspect.to_s,
    path: e.backtrace.join("\n"),
    cgi: cgi
  }
  print JSON.generate(response)
end
