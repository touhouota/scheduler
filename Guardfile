# minifyする
guard :shell do
  # hoge_concated.xxxを監視する
  watch(/(js|css)\/[\S]+_concated.(js|css)/) do |m|
    `rake minify #{m[0]}`
  end
end

guard :shell do
  # js
  watch(%r{^js\/[\S]+_min.js|^css/[\S]+.css|ruby\/[\S]+.rb|[\S]*.html}) do |m|
    puts "#{m[0]}が変更されたので、サーバへ上げ直すよ"
    `rake sync`
    # Macの画面に更新完了した旨をポップアップ
    `osascript -e 'display notification "rsync done!!" with title "Guard Auto Message"'`
  end
end

guard 'sass', input: 'scss', output: 'css'

# todoページのものを監視
guard :concat, type: 'js',
               files: %w[base_object notification chart_list_test progress_timer_todo timeline_list_test todo_simple todo_modal todo_page_simple], input_dir: 'js', output: 'js/todo_concated'
