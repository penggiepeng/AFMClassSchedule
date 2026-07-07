let classesData = [];

const filterConfig = [
  { key: 'clubLocation', label: 'Location' },
  { key: 'clubName', label: 'Club' },
  { key: 'classType', label: 'Class Type' },
  { key: 'className', label: 'Class Name' },
  { key: 'instructor', label: 'Instructor' },
  { key: 'day', label: 'Day' },
  { key: 'date', label: 'Date' },
  { key: 'timeOfDay', label: 'Time of Day' }
];

function getTimeOfDay(startTime) {
  const hour = parseInt(startTime.split(':')[0], 10);
  if (hour >= 7 && hour <= 11) return 'Morning';
  if (hour >= 12 && hour <= 16) return 'Afternoon';
  if (hour >= 17 && hour <= 19) return 'Evening';
  if (hour >= 20) return 'Night';
  return 'Other';
}

function formatTime(time24) {
  const [h, m] = time24.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function formatDateRange(dateStr) {
  const parts = dateStr.split(' - ');
  const format = (d) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  if (parts.length === 2) {
    return format(parts[0]) + ' - ' + format(parts[1]);
  }
  return format(dateStr);
}

function getDistinctValues(data, key) {
  if (key === 'timeOfDay') {
    const times = [...new Set(data.map(d => getTimeOfDay(d.startTime)))];
    const order = ['Morning', 'Afternoon', 'Evening', 'Night'];
    return times.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
  if (key === 'day') {
    const days = [...new Set(data.map(d => d[key]))];
    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
  return [...new Set(data.map(d => d[key]))].sort();
}

function buildFilters() {
  const filtersEl = document.getElementById('filters');
  filtersEl.innerHTML = '';

  filterConfig.forEach(({ key, label }) => {
    const group = document.createElement('div');
    group.className = 'filter-group';

    const lbl = document.createElement('label');
    lbl.textContent = label;
    lbl.setAttribute('for', `filter-${key}`);

    const select = document.createElement('select');
    select.id = `filter-${key}`;
    select.innerHTML = `<option value="">All</option>`;

    const values = getDistinctValues(classesData, key);
    values.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });

    select.addEventListener('change', applyFilters);

    group.appendChild(lbl);
    group.appendChild(select);
    filtersEl.appendChild(group);
  });
}

function applyFilters() {
  const filters = {};
  filterConfig.forEach(({ key }) => {
    const val = document.getElementById(`filter-${key}`).value;
    if (val) filters[key] = val;
  });

  let filtered = classesData.filter(item => {
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'timeOfDay') {
        if (getTimeOfDay(item.startTime) !== value) return false;
      } else {
        if (item[key] !== value) return false;
      }
    }
    return true;
  });

  renderClasses(filtered);
}

function renderClasses(data) {
  const grid = document.getElementById('class-grid');
  const info = document.getElementById('results-info');

  info.textContent = `Showing ${data.length} class${data.length !== 1 ? 'es' : ''}`;

  if (data.length === 0) {
    grid.innerHTML = '<div class="no-results">No classes found matching your filters.</div>';
    return;
  }

  grid.innerHTML = data.map(item => `
    <div class="class-card">
      <div class="card-header">
        <div class="card-header-left">
          <div class="club-name">${escapeHtml(item.clubName)}</div>
          <div class="class-name">${escapeHtml(item.className)}</div>
        </div>
        <div class="class-type">${escapeHtml(item.classType)}</div>
      </div>
      <div class="details">
        <div class="detail-row"><span class="icon">&#x1F4CD;</span>${escapeHtml(item.clubLocation)}</div>
        <div class="detail-row"><span class="icon">&#x1F464;</span>${escapeHtml(item.instructor)}</div>
        <div class="detail-row"><span class="icon">&#x1F550;</span>${escapeHtml(item.startTime)}</div>
        <div class="detail-row"><span class="icon">&#x1F4C6;</span>${escapeHtml(item.dayOfWeek)}</div>
        <div class="detail-row"><span class="icon">&#x1F4C5;</span>${escapeHtml(item.date)}</div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function init() {
  try {
    const response = await fetch('classes.json');
    classesData = await response.json();
    buildFilters();
    renderClasses(classesData);
  } catch (err) {
    document.getElementById('class-grid').innerHTML =
      '<div class="no-results">Failed to load class data.</div>';
  }
}

init();
