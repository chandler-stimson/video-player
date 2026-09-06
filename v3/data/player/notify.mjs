const notify = {};

const toast = document.createElement('div');
toast.style = `
  position: fixed;
  top: 10px;
  right: 10px;
`;
document.body.appendChild(toast);

let id;
notify.display = (msg, period = 750) => {
  toast.textContent = msg;
  clearTimeout(id);
  id = setTimeout(() => toast.textContent = '', period);
};
notify.prompt = (msg, label, onclick) => {
  notify.display(msg, 30000);
  const a = document.createElement('a');
  a.href = '#';
  a.textContent = label;
  a.style = 'margin-left: 5px; color: #4da3ff;';
  a.addEventListener('click', e => {
    e.preventDefault();
    notify.clear();
    onclick();
  });
  toast.appendChild(a);
};
notify.clear = () => {
  toast.textContent = '';
  clearTimeout(id);
};

export default notify;
