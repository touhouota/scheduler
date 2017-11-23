task :sync do
  `cat local_passwd | sudo -S rsync -pr --exclude-from=/Users/touhouota/.rsync/excludes . /Library/WebServer/Documents/b1013179/scheduler/`
end

task default: [:sync]
