# coding: utf-8
require './mail'

mail = SendMail.new(to: "ika@sketch.jp", from: "g2117034@fun.ac.jp")

subject = "日本語テスト日本語テスト日本語テスト日本語テスト日本語テスト日本語テスト"

body = "mail_body_here\n日本語おおおおおおおお"

mail.send(subject: subject, body: body)
