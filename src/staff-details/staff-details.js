const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');
const chevron = document.getElementById('chevron');
const backButtonContainer = document.getElementById('backBtn');
const toast = document.getElementById('toast');
const addJobBtn = document.getElementById('addJobBtn');
const jobModal = document.getElementById('jobModal');
const cancelJob = document.getElementById('cancelJob');
const jobForm = document.getElementById('jobForm');
const jobsGrid = document.getElementById('jobsGrid');
const activeCount = document.getElementById('activeCount');
const notificationBtn = document.getElementById('notificationBtn');
const roles = document.querySelectorAll('#roles button');

let jobs = [
  { plate: 'AB 123 CD', client: 'Emri i Klientit', mechanic: 'Emri Mekanikut 1\nEmri Mekanikut 2', date: '30/09/2025' },
  { plate: 'AB 123 CD', client: 'Emri i Klientit', mechanic: 'Emri Mekanikut 1\nEmri Mekanikut 2', date: '30/09/2025' }
];

function renderJobs() {
  jobsGrid.innerHTML = jobs.map((job, index) => `
    <article class="job-card" data-index="${index}">
      <div class="job-top">
        <div class="folder">&#128193;</div>
        <div>
          <p class="plate">${job.plate}</p>
          <p class="client">${job.client}</p>
        </div>
        <div class="status">&#8226; Aktiv</div>
      </div>
      <hr />
      <div class="job-body">
        <p class="muted">Staff</p>
        <p>${job.mechanic.replaceAll('\n', '<br>')}</p>
        <p class="muted">Data e P&euml;rfundimit</p>
        <p>${job.date}</p>
      </div>
    </article>
  `).join('');
  activeCount.textContent = jobs.length;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function openModal() {
  jobModal.classList.add('show');
  jobModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  jobModal.classList.remove('show');
  jobModal.setAttribute('aria-hidden', 'true');
  jobForm.reset();
}

createBackButton(backButtonContainer, {
  text: 'Kthehu te lista',
  ariaLabel: 'Kthehu te lista',
  onClick: () => showToast('U hap faqja e list\u00ebs')
});

profileBtn.addEventListener('click', () => {
  profileMenu.classList.toggle('open');
  chevron.innerHTML = profileMenu.classList.contains('open') ? '&#8963;' : '&#8964;';
});

notificationBtn.addEventListener('click', () => showToast('Ke 2 njoftime t\u00eb reja'));
addJobBtn.addEventListener('click', openModal);
cancelJob.addEventListener('click', closeModal);

jobModal.addEventListener('click', event => {
  if (event.target === jobModal) closeModal();
});

jobForm.addEventListener('submit', event => {
  event.preventDefault();
  const date = new Date(document.getElementById('date').value);
  const formatted = date.toLocaleDateString('en-GB');
  jobs.push({
    plate: document.getElementById('plate').value,
    client: document.getElementById('client').value,
    mechanic: document.getElementById('mechanic').value,
    date: formatted
  });
  renderJobs();
  closeModal();
  showToast('Puna e re u shtua');
});

jobsGrid.addEventListener('click', event => {
  const card = event.target.closest('.job-card');
  if (!card) return;
  showToast(`U zgjodh puna ${jobs[card.dataset.index].plate}`);
});

roles.forEach(role => {
  role.addEventListener('click', () => {
    roles.forEach(item => item.classList.remove('active'));
    role.classList.add('active');
    showToast(`Roli: ${role.textContent}`);
  });
});

renderJobs();
