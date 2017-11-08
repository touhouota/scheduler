require 'net/smtp'
require 'json'
require 'base64'

class SendMail
  def initialize(to: 'to@mail.com', from: 'from@mail.com', option: {})
    # 引数を取り込む
    @smtp_option = {
      server:        'smtp.gmail.com',  # <= SMTP サーバのアドレス
      port:            587,              # <= Port 番号（単純な SMTP なら 25）
      authentication: :plain,          # <= 認証方式（コメントアウトしても問題ない）
      ssl:             true,          # <= SSL 認証（単純な SMTP なら false もしくはコメントアウト）
    }

    @smtp_option.merge!(option)
    # 認証情報を合わせ
    @smtp_option.merge!(load_secret)
    @from = from
    @to = to
    @date = Time.now.strftime("%a, %d %b %Y %X")
  end

  # パスワードとかを記しておくもの
  def load_secret
    File.open("./secret.json") do |file|
      JSON.load(file)
    end
  end
  
  def create_subject(subject)
    str = ""
    Base64.encode64(subject).split("\n").each do |string|
      str += "=?UTF-8?B?#{string}?= "
    end
    return str.rstrip
  end

  def create_body(subject: 'sample subject', body: 'mail main body')
    @message = <<EOS
Date: #{@date}
From: #{@from}
To: #{@to}
Subject: #{create_subject(subject)}
Content-Type: text/plain; charset=UTF-8
Mine-Version: 1.0

#{body}
EOS
  end

  def send(subject: "test mail", body: "this mail is test!")
    count = 0
    begin
      create_body(subject: subject, body: body)
      mail = Net::SMTP.new(@smtp_option[:server], @smtp_option[:port])
      mail.enable_ssl if @smtp_option[:ssl]
      mail.start(@smtp_option[:server], @smtp_option["mail"], @smtp_option["pass"])
      mail.send_mail(@message, @from, @to)
      mail.finish
    rescue => e
        count += 1
        if count < 10 then
          puts "retry"
          retry
        else
          puts e.class
          puts e.message
        end
    end
  end
end
