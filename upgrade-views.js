const fs = require('fs');
const path = require('path');

const walk = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          if (file.endsWith('.ejs') && !file.includes('dashboard.ejs') && !file.includes('layout.ejs') && !file.includes('navbar.ejs') && !file.includes('sidebar.ejs')) {
            results.push(file);
          }
          next();
        }
      });
    })();
  });
};

walk(path.join(__dirname, 'views'), function(err, results) {
  if (err) throw err;
  let count = 0;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Apply design system changes
    content = content.replace(/class="card"/g, 'class="card border-0 shadow-sm"');
    content = content.replace(/class="card mt-4"/g, 'class="card border-0 shadow-sm mt-4"');
    content = content.replace(/class="card-header/g, 'class="card-header bg-white border-bottom-0 pt-4 pb-0');
    content = content.replace(/class="table"/g, 'class="table table-hover align-middle"');
    content = content.replace(/<thead class="table-dark">/g, '<thead class="table-light">');
    content = content.replace(/<thead class="bg-light">/g, '<thead class="table-light">');
    content = content.replace(/<thead>/g, '<thead class="table-light">');
    content = content.replace(/class="form-label"/g, 'class="form-label fw-bold"');
    content = content.replace(/<th/g, '<th class="text-muted fw-bold text-uppercase" style="font-size: 0.75rem; letter-spacing: 0.5px;"');
    content = content.replace(/class="btn btn-primary"/g, 'class="btn btn-primary shadow-sm rounded-pill px-4"');
    
    // Add empty state icons if there's a generic "No xyz found."
    content = content.replace(/<td colspan="(\d+)" class="text-center">No (.*?)<\/td>/g, `<td colspan="$1" class="text-center py-5">
      <div class="empty-state p-0">
        <i class="fas fa-folder-open text-muted opacity-50 mb-3" style="font-size: 2.5rem;"></i>
        <h6 class="fw-bold">No $2</h6>
        <p class="small text-muted mb-0">Records will appear here once added.</p>
      </div>
    </td>`);
    
    if (original !== content) {
      fs.writeFileSync(file, content, 'utf8');
      count++;
      console.log(`Updated: ${file.split('/views/')[1]}`);
    }
  });
  console.log(`Successfully upgraded ${count} views.`);
});
