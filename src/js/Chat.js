import ChatAPI from "./api/ChatAPI";

export default class Chat {
  constructor(container) {
    this.container = container;
    this.api = new ChatAPI();
    this.websocket = null;
    this.user = null;
    this.isLoading = false;
    this.isClosing = false;
  }

  init() {
    this.bindToDOM();
    this.registerEvents();
  }

  bindToDOM() {
    const modalForm = `
      <div class="modal__form active">
        <div class="modal__background"></div>
        <div class="modal__content">
          <form class="form" id="modal_form">
            <h2 class="modal__header">Авторизация</h2>
            <div class="modal__body">
              <div class="modal__form-body">
                <div class="form__group">
                  <label for="nickname" class="form__label">Выберите псевдоним</label>
                  <input type="text" id="nickname" class="form__input">
                </div>
                <div class="form__hint"></div>
              </div>          
            </div>
            <div class="modal__footer">
              <button type="submit" class="modal__ok">Продолжить</button>        
            </div>
          </form>
        </div>
      </div>
    `;
    this.container.insertAdjacentHTML('afterbegin', modalForm);

    const chatForm = `
      <div class="ct-container hidden">
        <h1 class="chat__header">Чатик</h1>
        <div class="chat__connect"></div>
        <div class="chat__container">
          <div class="chat__userlist"></div>
          <div class="chat__area">
            <div class="chat__messages-container"></div>
            <form class="form chat__messages-input" id="form-message">
              <input type="text" class="form__input" placeholder="Введите ваше сообщение">
            </form>
          </div>
          
        </div>
      </div>
    `;
    this.container.insertAdjacentHTML('beforeend', chatForm);
    
    this.modalForm = this.container.querySelector('.modal__form');
    this.modalFormElement = this.modalForm.querySelector('#modal_form');            // form
    this.nameInput = this.modalForm.querySelector('.form__input');
    this.hint = this.modalForm.querySelector('.form__hint');
    this.chatContainer = this.container.querySelector('.ct-container');
    this.chatConnect = this.chatContainer.querySelector('.chat__connect');
    this.messageContainer = this.chatContainer.querySelector('.chat__messages-container');
    this.formMessage = this.chatContainer.querySelector('#form-message');               // form
    this.messageInput = this.formMessage.querySelector('.form__input');
    this.userList = this.chatContainer.querySelector('.chat__userlist');
  }

  registerEvents() {
    this.modalFormElement.addEventListener('submit', this.onEnterChatHandler);
    this.formMessage.addEventListener('submit', this.sendMessage);
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  connect() {
    const wsUrl = this.api.wsUrl();
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onopen = this.onopen;
    this.websocket.onmessage = this.onmessage;
    this.websocket.onclose = this.onclose;
    this.websocket.onerror = this.onerror;
  }

  onopen = () => {
    if (!this.user) return;

    const data = {
      type: 'auth',
      userId: this.user.id
    }
    this.send(data);
  }

  onmessage = (messageEvent) => {
    let data;
    try {
      data = JSON.parse(messageEvent.data);
    } catch (e) {
      console.log(e);
      return;
    }

    if (typeof data.type !== 'string') {
      return;
    }

    switch (data.type) {
      case 'auth-ok':
        break;
      case 'users':
        this.renderUsers(data.users);
        break;
      case 'message':
        this.renderMessage(data);
        break;
      case 'error':
        console.log(data.message);
        break;
      default:
        break;
    }
  }

  onclose = () => {    
    this.websocket = null;
    if (!this.isClosing) {
      console.log('Соединение потеряно');
    }
  }

  onerror = (event) => {
    console.error('WebSocket error:', event);
  }

  send(payload) {
    if (!this.websocket) return;

    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(payload));
    }
  }

  onEnterChatHandler = async (event) => {
    event.preventDefault();

    if (this.isLoading) return;

    const name = this.nameInput.value.trim();

    if (name === '') {
      this.hint.textContent = 'Введите ник';
      return
    }

    this.hint.textContent = '';

    try {
      this.isLoading = true
      const data = await this.api.createUser(name);
      this.user = data.user;

      this.modalForm.classList.remove('active');
      this.chatContainer.classList.remove('hidden');
      this.chatConnect.textContent = this.user.name;
      
      this.nameInput.value = '';

      this.connect();

    } catch (err) {
      if (err.status === 400) {
        this.hint.textContent = 'Введите ник';
        return;
      }
      if (err.status === 409) {
        this.hint.textContent = 'Этот ник уже занят, выберите другой';
        return;
      }      
      this.hint.textContent= 'Ошибка сервера, попробуйте позже';
    } finally {
      this.isLoading = false;
    }        
  }    

  onBeforeUnload = () => {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.isClosing = true;
      this.send({ type: 'exit' });
      this.websocket.close();
    };
  }

  renderUsers = (users) => {
    this.userList.replaceChildren();

    const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(user => {
      const chatUser = document.createElement('div');
      chatUser.classList.add('chat__user');

      if (user.id === this.user.id) {
        chatUser.classList.add('chat__user_current');
        chatUser.textContent = 'You';
      } else {      
        chatUser.textContent = user.name;        
      }
      this.userList.appendChild(chatUser);
    });    
  }

  renderMessage = (data, isOwn = false) => {
    if (isOwn) {
      const mesContainerYourself = document.createElement('div');
      mesContainerYourself.classList.add('message__container', 'message__container-yourself');
      this.messageContainer.appendChild(mesContainerYourself);

      const mesYouUser = document.createElement('div');
      mesYouUser.classList.add('message__header');
      mesYouUser.textContent = 'You';
      mesContainerYourself.appendChild(mesYouUser);

      const mesTextYou = document.createElement('div');
      mesTextYou.classList.add('message__text');
      mesTextYou.textContent = String(data.text ?? '').slice(0, 2000);
      mesContainerYourself.appendChild(mesTextYou);

      this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    } else {
      const mesContainerInterlocutor = document.createElement('div');
      mesContainerInterlocutor.classList.add('message__container', 'message__container-interlocutor');
      this.messageContainer.appendChild(mesContainerInterlocutor);

      const mesNameUser = document.createElement('div');
      mesNameUser.classList.add('message__header');
      mesNameUser.textContent = data.from?.name ?? 'Неизвестный';
      mesContainerInterlocutor.appendChild(mesNameUser);

      const mesTextUser = document.createElement('div');
      mesTextUser.classList.add('message__text');
      mesTextUser.textContent = String(data.text ?? '').slice(0, 2000);
      mesContainerInterlocutor.appendChild(mesTextUser);

      this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }
  }

  sendMessage = (event) => {
    event.preventDefault();

    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    const text = this.messageInput.value.trim().slice(0, 2000);
    if (!text) return;

    this.renderMessage({ text, from: this.user }, true);
    this.send({ type: 'send', text });

    this.messageInput.value = '';
    this.messageInput.focus();
  }
}
