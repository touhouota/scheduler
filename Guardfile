guard :shell do
  # watch(/(js|ruby|css|)?\/*/) do |m|
  watch(%r{^(js|ruby|css|[^.!])?\/[\S]+.[\S]|[\S]*.html}) do |m|
    puts m[0]
    `rake sync`
    # Macの画面に更新完了した旨をポップアップ
    `osascript -e 'display notification "rsync done!!" with title "Guard Auto Message"'`
  end
end

guard 'sass', input: 'scss', output: 'css'
