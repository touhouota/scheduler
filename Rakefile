require 'bundler'
require 'yaml'
Bundler.require
$pass = YAML.load_file('./local_passwd.yaml')
desc 'ファイルをローカルサーバへ転送する'
task :sync do
  `echo #{$pass[:local]} | sudo -S rsync -pr --exclude-from=/Users/touhouota/.rsync/excludes . /Library/WebServer/Documents/b1013179/scheduler/`
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

task :mimalab do
  `rsync -pvr -e "ssh -i ~/.ssh/1013179_mimalab_rsa " --exclude-from=/Users/touhouota/.rsync/excludes ~/Dropbox/Program/5_master/scheduler b1013179@mimalab.c.fun.ac.jp:/var/www/html/b1013179`
  ``
end
