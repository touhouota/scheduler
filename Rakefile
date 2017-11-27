require 'bundler'
Bundler.require

desc 'ファイルをローカルサーバへ転送する'
task :sync do
  `cat local_passwd | sudo -S rsync -pr --exclude-from=/Users/touhouota/.rsync/excludes . /Library/WebServer/Documents/b1013179/scheduler/`
end

desc 'JS/CSSファイルを連結、圧縮する'
file :minify do
  require 'yui/compressor'

  target = ARGV.last
  minify = nil
  p target
  case File.extname(target)
  when '.js'
    minify = YUI::JavaScriptCompressor.new
  when '.css'
    minify = YUI::CssCompressor.new
  end
  # jsでもcssでもない時は nilのまま
  return if minify.nil?

  puts "minify: #{target}"
  minify_src = minify.compress(File.read(target))
  min_file_name = target.split('_').first + '_min.js'
  puts "Minify result write to => #{min_file_name}"
  File.write(min_file_name, minify_src)
end
