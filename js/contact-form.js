// Compose a Gmail draft only; the visitor reviews it and presses Send in Gmail.
const form = document.getElementById('contact-form');
const status = document.getElementById('contact-form-status');
const gmailLink = document.getElementById('contact-gmail');
const singleLine = value => String(value || '').replace(/\s+/g, ' ').trim();
const paragraphs = value => String(value || '').replace(/\r\n?/g, '\n')
  .split('\n').map(line => line.replace(/[\t ]+/g, ' ').trim()).join('\n')
  .replace(/\n{3,}/g, '\n\n').trim();

function draftUrl() {
  const data = Object.fromEntries(new FormData(form));
  const name = singleLine(data.name);
  const email = singleLine(data.email);
  const category = singleLine(data.category) || 'To be discussed';
  const project = paragraphs(data.project) || 'I would like to discuss a project with you.';
  const body = [
    'Hi Khubaib,', '',
    'I’m interested in working with you on a project.', '',
    `Project category: ${category}`, '',
    'Project details:', project, '',
    'Please let me know your availability and the next steps.', '',
    'Best regards,', name || 'Your name', ...(email ? [`Contact email: ${email}`] : []),
  ].join('\n');
  return `https://mail.google.com/mail/?${new URLSearchParams({
    view: 'cm', fs: '1', to: 'khubaibnazeer8@gmail.com',
    su: `Project enquiry — ${category}${name ? ` — ${name}` : ''}`, body,
  })}`;
}
function updateDraft() {
  gmailLink.href = draftUrl();
  status.textContent = '';
}
form.addEventListener('input', updateDraft);
form.addEventListener('change', updateDraft);
for (const input of form.querySelectorAll('[required]')) {
  input.addEventListener('input', () => input.setCustomValidity(''));
}
updateDraft();

form.addEventListener('submit', event => {
  event.preventDefault();
  for (const input of form.querySelectorAll('input[required],textarea[required]')) {
    input.value = input.name === 'project' ? paragraphs(input.value) : singleLine(input.value);
    input.setCustomValidity(input.value ? '' : 'Please fill in this field.');
  }
  if (!form.reportValidity()) return;
  gmailLink.href = draftUrl();
  // A direct, user-triggered link opens reliably without an asynchronous popup.
  gmailLink.click();
  status.dataset.state = 'success';
  status.textContent = 'Review your draft and press Send in Gmail. If Gmail didn’t open, use the Email button. Your details are kept here.';
});
