// ==================== APP MODULE REGISTRY & INITIALIZATION SYSTEM ====================
// Centralized module management for better modularity and separation of concerns
window.App = {
  modules: {},
  initialized: false,
  
  register(name, module) {
    if (this.modules[name]) {
      console.warn(`Module "${name}" already registered, skipping...`);
      return;
    }
    this.modules[name] = module;
    console.log(`✓ Registered module: ${name}`);
  },

  init(name) {
    const module = this.modules[name];
    if (!module) {
      console.error(`Module "${name}" not found`);
      return false;
    }
    if (module.initialized) {
      console.warn(`Module "${name}" already initialized`);
      return false;
    }
    if (typeof module.init === 'function') {
      module.init();
      module.initialized = true;
      return true;
    }
    return false;
  },

  initAll() {
    if (this.initialized) {
      console.warn('App already initialized');
      return;
    }
    const moduleNames = Object.keys(this.modules);
    console.log(`\n🚀 Initializing ${moduleNames.length} modules...`);
    moduleNames.forEach(name => {
      try {
        this.init(name);
      } catch (err) {
        console.error(`Failed to initialize module "${name}":`, err);
      }
    });
    this.initialized = true;
    console.log(`✅ App initialization complete\n`);
  },

  getModule(name) {
    return this.modules[name];
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => window.App.initAll());

console.log('✓ App module registry loaded');

// ===== Class Name Utility (cn) =====
// Combines clsx + tailwind-merge functionality for intelligent class composition
window.cn = function(...inputs) {
  // clsx-like: converts various input types to class strings
  const clsx = (value) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(clsx).filter(Boolean).join(' ');
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(' ');
    }
    return '';
  };

  // Process all inputs through clsx
  const allClasses = inputs
    .map(clsx)
    .filter(Boolean)
    .join(' ');

  // Simple tailwind-merge: remove duplicate/conflicting utilities
  // Groups classes by their prefix to detect conflicts
  const classes = allClasses.split(/\s+/).filter(Boolean);
  const seen = new Map(); // Maps: prefix -> last index of that prefix
  
  const conflicts = [
    // Layout: display
    ['block', 'inline', 'inline-block', 'flex', 'grid', 'hidden'],
    // Spacing: margin
    ['m-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-6', 'm-8', 'm-10', 'm-12'],
    // Spacing: padding
    ['p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'p-8', 'p-10', 'p-12'],
    // Width
    ['w-1', 'w-2', 'w-3', 'w-4', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-full', 'w-screen'],
    // Height
    ['h-1', 'h-2', 'h-3', 'h-4', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24', 'h-full', 'h-screen'],
    // Text color
    ['text-white', 'text-black', 'text-gray-100', 'text-gray-500', 'text-gray-900'],
    // Background color
    ['bg-white', 'bg-black', 'bg-gray-100', 'bg-gray-500', 'bg-gray-900'],
    // Rounded corners
    ['rounded-0', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-full'],
  ];

  // Track which conflict groups have been seen
  const conflictGroups = new Map();
  conflicts.forEach((group, idx) => {
    group.forEach(cls => conflictGroups.set(cls, idx));
  });

  const result = [];
  const addedGroups = new Set();

  // Reverse iteration to keep last occurrence of conflicting classes
  for (let i = classes.length - 1; i >= 0; i--) {
    const cls = classes[i];
    const groupIdx = conflictGroups.get(cls);

    if (groupIdx !== undefined) {
      if (!addedGroups.has(groupIdx)) {
        result.unshift(cls);
        addedGroups.add(groupIdx);
      }
    } else {
      // Non-conflicting classes are always kept
      if (!result.includes(cls)) {
        result.unshift(cls);
      }
    }
  }

  return result.join(' ');
};

console.log('cn utility (class name merger) loaded successfully');

// ==================== UTILITIES MODULE ====================
App.register('Utilities', {
  init() {
    // All utilities are already registered on window
    console.log('✓ Utilities module initialized');
  }
});

// ==================== matchMedia Polyfill (for tests/demos) ====================
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
  console.log('matchMedia polyfill applied');
}

// ===== Form Utilities (Vanilla JS, shadcn/ui-style) =====
// Provides helpers analogous to Form, FormItem, FormLabel, FormControl,
// FormDescription, FormMessage, and FormField wiring with basic validation.

(function () {
  let __formCounter = 0;

  function createForm(options = {}) {
    const { idPrefix = 'form', onSubmit } = options;
    const formId = `${idPrefix}-${++__formCounter}`;
    const formEl = document.createElement('form');
    formEl.className = 'form';

    const ctx = {
      id: formId,
      formEl,
      fields: new Map(),
      errors: {},
      registerField(name, field) {
        this.fields.set(name, field);
      },
      getValues() {
        const v = {};
        this.fields.forEach((f, n) => {
          const el = f.controlEl;
          if (!el) return;
          if (el.type === 'checkbox') v[n] = el.checked;
          else v[n] = el.value;
        });
        return v;
      },
      setValues(values) {
        Object.entries(values || {}).forEach(([n, val]) => {
          const f = this.fields.get(n);
          if (f && f.controlEl) {
            if (f.controlEl.type === 'checkbox') f.controlEl.checked = !!val;
            else f.controlEl.value = val ?? '';
          }
        });
      },
      setError(name, message) {
        const f = this.fields.get(name);
        if (!f) return;
        f.container.classList.add('form-invalid');
        f.messageEl.textContent = message || '';
        f.controlEl.setAttribute('aria-invalid', 'true');
        updateDescribedBy(f);
        this.errors[name] = message || '';
      },
      clearError(name) {
        const f = this.fields.get(name);
        if (!f) return;
        f.container.classList.remove('form-invalid');
        f.messageEl.textContent = '';
        f.controlEl.setAttribute('aria-invalid', 'false');
        updateDescribedBy(f);
        delete this.errors[name];
      },
      reset() {
        this.fields.forEach((f) => {
          if (f.controlEl.type === 'checkbox') f.controlEl.checked = !!f.defaultValue;
          else f.controlEl.value = f.defaultValue ?? '';
          this.clearError(f.name);
        });
      },
      createItem(opts) {
        const {
          name,
          label,
          description,
          type = 'text',
          value = '',
          required = false,
          placeholder = '',
          options,
          rules = {},
          validateOn = ['blur', 'input', 'change'],
        } = opts || {};

        const container = document.createElement('div');
        container.className = 'form-item';

        const controlId = `${formId}-${name}`;
        const labelEl = createFormLabel(label, controlId);
        if (required) labelEl.classList.add('required');

        const controlEl = createFormControl(type, { id: controlId, placeholder, options });
        if (type === 'checkbox') controlEl.checked = !!value;
        else controlEl.value = value ?? '';

        const descEl = description ? createFormDescription(description) : null;
        const messageEl = createFormMessage('');

        container.appendChild(labelEl);
        container.appendChild(controlEl);
        if (descEl) container.appendChild(descEl);
        container.appendChild(messageEl);

        // Accessibility wiring
        controlEl.setAttribute('aria-invalid', 'false');
        updateDescribedBy({ descriptionEl: descEl, messageEl, controlEl });

        const field = {
          name,
          container,
          labelEl,
          controlEl,
          descriptionEl: descEl,
          messageEl,
          defaultValue: value,
          rules,
        };
        this.registerField(name, field);

        // Validation hooks
        validateOn.forEach((evt) =>
          controlEl.addEventListener(evt, () => {
            const err = validateValue(controlEl, rules);
            if (err) this.setError(name, err);
            else this.clearError(name);
          })
        );

        return container;
      },
    };

    if (typeof onSubmit === 'function') {
      formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        onSubmit(ctx.getValues(), ctx);
      });
    }

    function updateDescribedBy(f) {
      const ids = [];
      if (f.descriptionEl && f.descriptionEl.id) ids.push(f.descriptionEl.id);
      if (f.messageEl && f.messageEl.id && f.messageEl.textContent) ids.push(f.messageEl.id);
      if (ids.length) f.controlEl.setAttribute('aria-describedby', ids.join(' '));
      else f.controlEl.removeAttribute('aria-describedby');
    }

    function validateValue(el, rules) {
      if (!rules) return null;
      const val = el.type === 'checkbox' ? (el.checked ? 'on' : '') : (el.value || '');
      if (rules.required && !val) return typeof rules.required === 'string' ? rules.required : 'This field is required.';
      if (rules.minLength && val.length < rules.minLength) return `Must be at least ${rules.minLength} characters.`;
      if (rules.pattern && !rules.pattern.test(val)) return 'Invalid format.';
      if (typeof rules.validate === 'function') {
        const res = rules.validate(val, el);
        if (typeof res === 'string') return res;
        if (res === false) return 'Invalid value.';
      }
      return null;
    }

    return ctx;
  }

  function createFormLabel(text, forId) {
    const label = document.createElement('label');
    label.className = 'form-label';
    if (forId) label.setAttribute('for', forId);
    label.textContent = text || '';
    return label;
  }

  function createFormControl(type = 'text', attrs = {}) {
    let el;
    if (type === 'textarea') {
      el = document.createElement('textarea');
      el.className = 'form-textarea';
    } else if (type === 'select') {
      el = document.createElement('select');
      el.className = 'form-select';
      if (Array.isArray(attrs.options)) {
        attrs.options.forEach((opt) => {
          const o = document.createElement('option');
          if (typeof opt === 'object') {
            o.value = opt.value ?? opt.label;
            o.textContent = opt.label ?? opt.value;
          } else {
            o.value = opt;
            o.textContent = opt;
          }
          el.appendChild(o);
        });
      }
    } else if (type === 'checkbox') {
      el = document.createElement('input');
      el.type = 'checkbox';
      el.className = 'form-input';
    } else {
      el = document.createElement('input');
      el.type = type;
      el.className = 'form-input';
    }

    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'options') return; // already handled
      if (v !== undefined && v !== null) el.setAttribute(k, String(v));
    });
    return el;
  }

  function createFormDescription(text) {
    const p = document.createElement('p');
    p.className = 'form-description';
    p.textContent = text || '';
    p.id = `fd-${Math.random().toString(36).slice(2)}`;
    return p;
  }

  function createFormMessage(text, type = 'error') {
    const p = document.createElement('p');
    p.className = 'form-message' + (type === 'success' ? ' form-success' : '');
    p.textContent = text || '';
    p.id = `fm-${Math.random().toString(36).slice(2)}`;
    return p;
  }

  function createFormField(formCtx, opts) {
    return formCtx.createItem(opts);
  }

  // Expose helpers
  window.createForm = window.createForm || createForm;
  window.createFormItem = window.createFormItem || function (formCtx, opts) { return formCtx.createItem(opts); };
  window.createFormLabel = window.createFormLabel || createFormLabel;
  window.createFormControl = window.createFormControl || createFormControl;
  window.createFormDescription = window.createFormDescription || createFormDescription;
  window.createFormMessage = window.createFormMessage || createFormMessage;
  window.createFormField = window.createFormField || createFormField;
  
  // Register FormUtils module
  App.register('FormUtils', {
    createForm,
    createFormLabel,
    createFormControl,
    createFormDescription,
    createFormMessage,
    createFormField,
    
    init() {
      console.log('✓ FormUtils module initialized');
    }
  });
})();

// Usage example:
// ===== Hover Card Utilities (Vanilla JS) =====
(function () {
  function createHoverCardContent({ className = '', width = 256 } = {}) {
    const el = document.createElement('div');
    el.className = `hover-card-content${className ? ' ' + className : ''}`;
    el.style.width = `${width}px`;
    el.setAttribute('role', 'tooltip');
    el.style.display = 'none';
    return el;
  }

  function attachHoverCard(triggerEl, contentEl, options = {}) {
    const {
      side = 'top',
      align = 'center',
      sideOffset = 8,
      openDelay = 150,
      closeDelay = 150,
      container = document.body,
    } = options;

    let openTimer = null;
    let closeTimer = null;
    let isOpen = false;

    function clearTimers() {
      if (openTimer) { clearTimeout(openTimer); openTimer = null; }
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    }

    function position() {
      const rect = triggerEl.getBoundingClientRect();
      const cw = contentEl.offsetWidth;
      const ch = contentEl.offsetHeight;
      let x = rect.left, y = rect.top;

      if (side === 'top') {
        y = rect.top - ch - sideOffset;
        x = computeAlignX(rect, cw, align);
      } else if (side === 'bottom') {
        y = rect.bottom + sideOffset;
        x = computeAlignX(rect, cw, align);
      } else if (side === 'left') {
        x = rect.left - cw - sideOffset;
        y = computeAlignY(rect, ch, align);
      } else if (side === 'right') {
        x = rect.right + sideOffset;
        y = computeAlignY(rect, ch, align);
      }

      // Boundary guards
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      x = Math.max(8, Math.min(x, vw - cw - 8));
      y = Math.max(8, Math.min(y, vh - ch - 8));

      contentEl.style.left = `${Math.round(x)}px`;
      contentEl.style.top = `${Math.round(y)}px`;
      contentEl.dataset.side = side;
    }

    function computeAlignX(rect, cw, align) {
      if (align === 'start') return rect.left;
      if (align === 'end') return rect.right - cw;
      return rect.left + (rect.width - cw) / 2; // center
    }

    function computeAlignY(rect, ch, align) {
      if (align === 'start') return rect.top;
      if (align === 'end') return rect.bottom - ch;
      return rect.top + (rect.height - ch) / 2; // center
    }

    function open() {
      clearTimers();
      openTimer = setTimeout(() => {
        if (isOpen) return;
        isOpen = true;
        if (!contentEl.isConnected) container.appendChild(contentEl);
        contentEl.style.display = 'block';
        contentEl.classList.remove('closing');
        position();
        triggerEl.setAttribute('aria-expanded', 'true');
      }, openDelay);
    }

    function close() {
      clearTimers();
      closeTimer = setTimeout(() => {
        if (!isOpen) return;
        isOpen = false;
        contentEl.classList.add('closing');
        // after animation
        setTimeout(() => {
          contentEl.style.display = 'none';
          contentEl.classList.remove('closing');
          triggerEl.setAttribute('aria-expanded', 'false');
        }, 130);
      }, closeDelay);
    }

    // Hover interactions
    triggerEl.addEventListener('mouseenter', open);
    triggerEl.addEventListener('mouseleave', () => close());
    contentEl.addEventListener('mouseenter', () => { clearTimers(); });
    contentEl.addEventListener('mouseleave', () => close());

    // Focus interactions for accessibility
    triggerEl.addEventListener('focus', open);
    triggerEl.addEventListener('blur', close);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // Reposition on resize/scroll
    const reposition = () => { if (isOpen) position(); };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    return {
      open,
      close,
      position,
      destroy() {
        clearTimers();
        triggerEl.removeEventListener('mouseenter', open);
        triggerEl.removeEventListener('mouseleave', close);
        triggerEl.removeEventListener('focus', open);
        triggerEl.removeEventListener('blur', close);
        contentEl.removeEventListener('mouseenter', clearTimers);
        contentEl.removeEventListener('mouseleave', close);
        window.removeEventListener('resize', reposition);
        window.removeEventListener('scroll', reposition, true);
        if (contentEl.parentNode) contentEl.parentNode.removeChild(contentEl);
      },
    };
  }

  function createSimpleHoverCard(triggerEl, html, options = {}) {
    const content = createHoverCardContent(options);
    content.innerHTML = html || '';
    return attachHoverCard(triggerEl, content, options);
  }

  // Expose
  window.createHoverCardContent = window.createHoverCardContent || createHoverCardContent;
  window.attachHoverCard = window.attachHoverCard || attachHoverCard;
  window.createSimpleHoverCard = window.createSimpleHoverCard || createSimpleHoverCard;
  
  // Register HoverCardUtils module
  App.register('HoverCardUtils', {
    createHoverCardContent,
    attachHoverCard,
    createSimpleHoverCard,
    
    init() {
      console.log('✓ HoverCardUtils module initialized');
    }
  });
})();

// ===== Input OTP Utilities (Vanilla JS) =====
(function () {
  function createInputOTP(options = {}) {
    const {
      length = 6,
      value = '',
      disabled = false,
      separatorEvery = 3, // adds a visual separator every N slots
      separatorContent = '•',
      allowed = /[0-9]/, // regex for allowed characters
      onChange = null,
      onComplete = null,
      ariaLabel = 'One-time passcode'
    } = options;

    const container = document.createElement('div');
    container.className = 'otp-container' + (disabled ? ' disabled' : '');
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', ariaLabel);

    const group = document.createElement('div');
    group.className = 'otp-group';
    group.tabIndex = disabled ? -1 : 0;
    container.appendChild(group);

    const state = {
      length,
      chars: Array.from({ length }, (_, i) => value[i] || ''),
      activeIndex: 0,
      disabled,
    };

    const slots = [];
    for (let i = 0; i < length; i++) {
      const slot = document.createElement('div');
      slot.className = 'otp-slot';
      slot.textContent = state.chars[i] || '';
      slots.push(slot);
      group.appendChild(slot);

      // separators (visual only)
      if (separatorEvery && (i + 1) % separatorEvery === 0 && i !== length - 1) {
        const sep = document.createElement('div');
        sep.className = 'otp-separator';
        sep.textContent = separatorContent;
        group.appendChild(sep);
      }
    }

    function render() {
      slots.forEach((slot, i) => {
        slot.textContent = state.chars[i] || '';
        if (i === state.activeIndex) {
          slot.classList.add('otp-slot-active');
          // show caret if empty
          ensureCaret(slot, !state.chars[i]);
        } else {
          slot.classList.remove('otp-slot-active');
          removeCaret(slot);
        }
      });
    }

    function ensureCaret(slot, show) {
      removeCaret(slot);
      if (!show) return;
      const caret = document.createElement('div');
      caret.className = 'otp-caret';
      slot.appendChild(caret);
    }

    function removeCaret(slot) {
      const existing = slot.querySelector('.otp-caret');
      if (existing) existing.remove();
    }

    function setActive(index) {
      state.activeIndex = Math.max(0, Math.min(index, state.length - 1));
      render();
    }

    function setValue(newVal) {
      const chars = (newVal || '').split('').filter((c) => allowed.test(c)).slice(0, state.length);
      for (let i = 0; i < state.length; i++) {
        state.chars[i] = chars[i] || '';
      }
      // set focus to next empty or last
      const nextEmpty = state.chars.findIndex((c) => !c);
      setActive(nextEmpty === -1 ? state.length - 1 : nextEmpty);
      emitChange();
      checkComplete();
    }

    function getValue() {
      return state.chars.join('');
    }

    function clear() {
      state.chars = Array.from({ length: state.length }, () => '');
      setActive(0);
      emitChange();
    }

    function emitChange() {
      if (typeof onChange === 'function') onChange(getValue());
    }

    function checkComplete() {
      if (state.chars.every((c) => c) && typeof onComplete === 'function') {
        onComplete(getValue());
      }
    }

    function handleCharInput(char) {
      if (!allowed.test(char)) return;
      state.chars[state.activeIndex] = char;
      if (state.activeIndex < state.length - 1) setActive(state.activeIndex + 1);
      render();
      emitChange();
      checkComplete();
    }

    function handleBackspace() {
      if (state.chars[state.activeIndex]) {
        state.chars[state.activeIndex] = '';
      } else if (state.activeIndex > 0) {
        setActive(state.activeIndex - 1);
        state.chars[state.activeIndex] = '';
      }
      render();
      emitChange();
    }

    function handlePaste(text) {
      const chars = text.split('').filter((c) => allowed.test(c));
      for (let i = 0; i < chars.length; i++) {
        const idx = state.activeIndex + i;
        if (idx >= state.length) break;
        state.chars[idx] = chars[i];
      }
      const nextEmpty = state.chars.findIndex((c) => !c);
      setActive(nextEmpty === -1 ? state.length - 1 : nextEmpty);
      render();
      emitChange();
      checkComplete();
    }

    // Events
    if (!disabled) {
      group.addEventListener('click', (e) => {
        const idx = slots.indexOf(e.target.closest('.otp-slot'));
        if (idx >= 0) setActive(idx);
        group.focus();
      });

      group.addEventListener('keydown', (e) => {
        if (e.key.length === 1 && allowed.test(e.key)) {
          e.preventDefault();
          handleCharInput(e.key);
          return;
        }
        switch (e.key) {
          case 'Backspace':
            e.preventDefault();
            handleBackspace();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            setActive(state.activeIndex - 1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            setActive(state.activeIndex + 1);
            break;
          case 'Home':
            e.preventDefault();
            setActive(0);
            break;
          case 'End':
            e.preventDefault();
            setActive(state.length - 1);
            break;
          default:
            break;
        }
      });

      group.addEventListener('paste', async (e) => {
        e.preventDefault();
        let text = '';
        if (e.clipboardData) {
          text = e.clipboardData.getData('text');
        } else if (navigator.clipboard) {
          text = await navigator.clipboard.readText();
        }
        if (text) handlePaste(text);
      });
    }

    // API
    container._otp = {
      setValue,
      getValue,
      clear,
      setActive,
    };

    // initial render/state
    setActive(state.chars.findIndex((c) => !c));
    render();
    return container;
  }

  function createInputOTPSeparator(content = '•') {
    const sep = document.createElement('div');
    sep.className = 'otp-separator';
    if (typeof content === 'string') sep.textContent = content;
    else sep.appendChild(content);
    return sep;
  }

  // Expose
  window.createInputOTP = window.createInputOTP || createInputOTP;
  window.createInputOTPSeparator = window.createInputOTPSeparator || createInputOTPSeparator;
  
  // Register InputOTPUtils module
  App.register('InputOTPUtils', {
    createInputOTP,
    createInputOTPSeparator,
    
    init() {
      console.log('✓ InputOTPUtils module initialized');
    }
  });
})();

// OTP Usage Example:
// const otp = createInputOTP({ length: 6, separatorEvery: 3, onComplete: (code) => console.log('OTP:', code) });
// document.body.appendChild(otp);
// const formCtx = createForm({ onSubmit: (values, ctx) => console.log(values) });
// const usernameField = createFormField(formCtx, {
//   name: 'username', label: 'Username', type: 'text', placeholder: 'jdoe',
//   rules: { required: true, minLength: 3 }
// });
// formCtx.formEl.appendChild(usernameField);
// document.body.appendChild(formCtx.formEl);
const API_BASE = 'http://localhost:8080/api';
let token, username, role;

// Check authentication on page load
window.onload = function () {
    token = localStorage.getItem('token');
    username = localStorage.getItem('username');
    role = localStorage.getItem('role');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize dark mode
    const storedTheme = localStorage.getItem('theme');
    const iconSvg = document.getElementById('themeIconSvg');
    
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        // Sun icon for dark mode
        iconSvg.innerHTML = '<circle cx="12" cy="12" r="5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="1" x2="12" y2="3" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke-width="2" stroke-linecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke-width="2" stroke-linecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke-width="2" stroke-linecap="round"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke-width="2" stroke-linecap="round"/>';
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        // Moon icon for light mode
        iconSvg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    }

    document.getElementById('userNameDisplay').textContent = `${username} (${role})`;
    loadProducts();
    loadTickets();
    loadProductsForTicketForm();
};

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

async function loadProducts() {
    const container = document.getElementById('productsList');
    
  // Show loading state
  container.innerHTML = `
    <div class="skeleton-card product-skeleton"></div>
    <div class="skeleton-card product-skeleton"></div>
    <div class="skeleton-card product-skeleton"></div>
  `;
    
    try {
        const response = await fetch(`${API_BASE}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            // Simulate loading delay for smooth transition
            setTimeout(() => displayProducts(products), 400);
        } else {
            container.innerHTML = '<p>Failed to load products.</p>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p>Failed to load products.</p>';
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsList');

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No products yet</h3>
        <p>Create your first product to get started</p>
        <button class="btn-primary" onclick="openProductModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create your first product
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map((product, index) => {
    const animationDelay = (index * 0.1).toFixed(2);
    return `
    <div class="product-card" style="animation: fadeInUp 0.5s ease-out ${animationDelay}s both;">
      <div class="product-card-header">
        <div class="product-card-left">
          <div class="product-icon">
            <svg viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div class="product-info">
            <h3>${product.productName}</h3>
            <p>ID: ${product.productId}</p>
          </div>
        </div>
        <div style="position: relative;">
          <button class="product-menu-btn" onclick="toggleProductMenu(event, ${product.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="1" stroke-width="2"/>
              <circle cx="12" cy="5" r="1" stroke-width="2"/>
              <circle cx="12" cy="19" r="1" stroke-width="2"/>
            </svg>
          </button>
          <div class="product-dropdown" id="productMenu-${product.id}">
            <button class="product-dropdown-item" onclick="editProduct(${product.id})">
              <svg viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button class="product-dropdown-item danger" onclick="deleteProduct(${product.id}, '${product.productName.replace(/'/g, "\\'")}')">  
              <svg viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
      <p class="product-description">${product.description || 'No description available'}</p>
    </div>
    `;
  }).join('');

  // Close dropdown when clicking outside
  document.addEventListener('click', closeAllProductMenus);
}
function toggleProductMenu(event, productId) {
    event.stopPropagation();
    const menu = document.getElementById(`productMenu-${productId}`);
    const allMenus = document.querySelectorAll('.product-dropdown');
    
    // Close all other menus
    allMenus.forEach(m => {
        if (m.id !== `productMenu-${productId}`) {
            m.classList.remove('active');
        }
    });
    
    // Toggle current menu
    menu.classList.toggle('active');
}

// Close all product menus
function closeAllProductMenus() {
    const allMenus = document.querySelectorAll('.product-dropdown');
    allMenus.forEach(menu => menu.classList.remove('active'));
}

// Edit product
function editProduct(productId) {
    closeAllProductMenus();
    alert(`Edit product functionality coming soon! Product ID: ${productId}`);
    // TODO: Implement edit modal
}

// Delete product
async function deleteProduct(productId, productName) {
    closeAllProductMenus();
    
    const confirmed = await showAlertDialog(
        'Delete Product',
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
        'Delete',
        'Cancel'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showSuccessAlert('Success', 'Product deleted successfully!');
            loadProducts();
        } else {
            const error = await response.text();
            showErrorAlert('Error', error || 'Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showErrorAlert('Connection Error', 'Could not connect to server');
    }
}

async function loadTickets() {
    const container = document.getElementById('ticketsList');
    
    // Show loading state
    container.innerHTML = `
        <div class="skeleton-card ticket-skeleton"></div>
        <div class="skeleton-card ticket-skeleton"></div>
        <div class="skeleton-card ticket-skeleton"></div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const tickets = await response.json();
            // Simulate loading delay for smooth transition
            setTimeout(() => displayTickets(tickets), 400);
        } else {
            container.innerHTML = '<p>Failed to load tickets.</p>';
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        container.innerHTML = '<p>Failed to load tickets.</p>';
    }
}

function displayTickets(tickets) {
    const container = document.getElementById('ticketsList');

    if (tickets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No tickets yet</h3>
                <p>Create a support ticket to get help</p>
                <button class="btn-primary" onclick="openTicketModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Create your first ticket
                </button>
            </div>
        `;
        return;
    }

    const statusClass = {
        'ACTIVE': 'status-open',
        'IN_PROGRESS': 'status-in-progress',
        'CLOSED': 'status-closed',
        'CANCELLED': 'status-closed'
    };

    const statusLabel = {
        'ACTIVE': 'Open',
        'IN_PROGRESS': 'In Progress',
        'CLOSED': 'Closed',
        'CANCELLED': 'Cancelled'
    };

    container.innerHTML = tickets.map((ticket, index) => {
        const animationDelay = (index * 0.1).toFixed(2);
        const createdDate = new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        return `
        <div class="ticket" style="animation: fadeInLeft 0.5s ease-out ${animationDelay}s both;">
            <div class="ticket-header">
                <div class="ticket-left">
                    <div class="ticket-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M3 7v4a1 1 0 0 0 1 1h3"/>
                            <path d="M7 7v10"/>
                            <path d="M10 8v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1Z"/>
                            <path d="M17 7v4a1 1 0 0 0 1 1h3"/>
                        </svg>
                    </div>
                    <div class="ticket-content">
                        <h3>${ticket.subject}</h3>
                        <p>${ticket.description}</p>
                    </div>
                </div>
                <span class="status-badge ${statusClass[ticket.status] || 'status-open'}">
                    ${statusLabel[ticket.status] || ticket.status}
                </span>
            </div>
            <div class="ticket-meta">
                <div class="ticket-meta-item">
                    <svg viewBox="0 0 24 24">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    <span>${ticket.productId || 'No Product'}</span>
                </div>
                <div class="ticket-meta-item">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>${createdDate}</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

async function loadCalls() {
    const container = document.getElementById('callsList');
    const statsContainer = document.getElementById('callsStats');
    
    // Show loading state
    statsContainer.style.display = 'none';
    container.innerHTML = `
        <div class="skeleton-card">
            <div class="skeleton-line long"></div>
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line short"></div>
        </div>
        <div class="skeleton-card">
            <div class="skeleton-line long"></div>
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line short"></div>
        </div>
        <div class="skeleton-card">
            <div class="skeleton-line long"></div>
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line short"></div>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/calls/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const calls = await response.json();
            // Simulate loading delay for smooth transition
            setTimeout(() => displayCalls(calls), 300);
        } else {
            container.innerHTML = '<p>Failed to load call history.</p>';
        }
    } catch (error) {
        console.error('Error loading calls:', error);
        container.innerHTML = '<p>No call history available.</p>';
    }
}

// Helper function to format duration
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function displayCalls(calls) {
    const container = document.getElementById('callsList');
    const statsContainer = document.getElementById('callsStats');

    if (calls.length === 0) {
        statsContainer.style.display = 'none';
        container.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: var(--text-muted); margin: 0 auto 16px;">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3>No call history yet</h3>
                <p>Start a voice call to see your history</p>
            </div>
        `;
        return;
    }

    // Calculate stats
    const totalCalls = calls.length;
    let totalSeconds = 0;
    
    calls.forEach(call => {
        if (call.duration) {
            totalSeconds += call.duration;
        }
    });

    const totalDuration = formatDuration(totalSeconds);
    const avgDuration = formatDuration(Math.floor(totalSeconds / totalCalls));

    // Display stats
    statsContainer.style.display = 'grid';
    statsContainer.innerHTML = `
        <div class="stat-card" style="animation-delay: 0s;">
            <div class="stat-card-content">
                <div class="stat-icon primary">
                    <svg viewBox="0 0 24 24">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <p>Total Calls</p>
                    <p>${totalCalls}</p>
                </div>
            </div>
        </div>
        <div class="stat-card" style="animation-delay: 0.1s;">
            <div class="stat-card-content">
                <div class="stat-icon success">
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <p>Total Duration</p>
                    <p>${totalDuration}</p>
                </div>
            </div>
        </div>
        <div class="stat-card" style="animation-delay: 0.2s;">
            <div class="stat-card-content">
                <div class="stat-icon warning">
                    <svg viewBox="0 0 24 24">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                        <polyline points="17 6 23 6 23 12"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <p>Avg Duration</p>
                    <p>${avgDuration}</p>
                </div>
            </div>
        </div>
    `;

    // Helper function to determine call type
    const getCallType = (call) => {
        if (!call.successful) return 'missed';
        return call.initiatedByAgent ? 'incoming' : 'outgoing';
    };

    // Helper function to format timestamp
    const formatTimestamp = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today, ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday, ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (diffDays < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' }) + ', ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const callIcons = {
        incoming: '📞',
        outgoing: '📱',
        missed: '❌'
    };

    const callLabels = {
        incoming: 'Incoming Call',
        outgoing: 'Outgoing Call',
        missed: 'Missed Call'
    };

    container.innerHTML = calls.map((call, index) => {
        const callType = getCallType(call);
        const duration = formatDuration(call.duration);
        const timestamp = formatTimestamp(call.startTime);
        const animationDelay = (index * 0.08).toFixed(2);
        
        return `
            <div class="call-log-card" style="animation: fadeInLeft 0.5s ease-out ${animationDelay}s both;">
                <div class="call-log-header">
                    <div class="call-log-left">
                        <div class="call-icon-wrapper ${callType}">
                            ${callIcons[callType]}
                        </div>
                        <div class="call-info">
                            <h3>${callLabels[callType]}</h3>
                            <p>${call.ticketId ? `Ticket: ${call.ticketId}` : 'Anonymous Support'}</p>
                        </div>
                    </div>
                    <div class="call-log-right">
                        <div class="call-duration">
                            <svg class="clock-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                                <path stroke-linecap="round" stroke-width="2" d="M12 6v6l4 2"/>
                            </svg>
                            <span>${duration}</span>
                        </div>
                        <p class="call-timestamp">${timestamp}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

@keyframes fadeInLeft {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

function showCreateTicket() {
    loadProductsForTicket();
    document.getElementById('ticketModal').style.display = 'block';
}

async function loadProductsForTicket() {
    try {
        const response = await fetch(`${API_BASE}/products/my-products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            const select = document.getElementById('ticketProduct');
            select.innerHTML = products.map(p =>
                `<option value="${p.id}">${p.productName}</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function createProduct(event) {
    event.preventDefault();

    const productData = {
        productId: document.getElementById('productId').value,
        productName: document.getElementById('productName').value,
        description: document.getElementById('productDesc').value
    };

    try {
        const response = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            showSuccessAlert('Success', 'Product created successfully!');
            closeModal('productModal');
            loadProducts();
        } else {
            showErrorAlert('Error', 'Failed to create product');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        showErrorAlert('Connection Error', 'Could not connect to server');
    }
    }
}

async function createTicket(event) {
    event.preventDefault();

    const ticketData = {
        subject: document.getElementById('ticketSubject').value,
        description: document.getElementById('ticketDesc').value,
        productId: parseInt(document.getElementById('ticketProduct').value)
    };

    try {
        const response = await fetch(`${API_BASE}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ticketData)
        });

        if (response.ok) {
            alert('Ticket created successfully!');
            closeModal('ticketModal');
            loadTickets();
        } else {
            alert('Failed to create ticket');
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        alert('Connection error');
    }
}

// Load products for ticket form dropdown
async function loadProductsForTicketForm() {
    try {
        const response = await fetch(`${API_BASE}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            const select = document.getElementById('ticketProduct');
            select.innerHTML = '<option value="">Select a product</option>' +
                products.map(p => `<option value="${p.id}">${p.productName} (${p.productId})</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Submit product form
async function submitProduct(event) {
    event.preventDefault();

    const productData = {
        productId: document.getElementById('productId').value,
        productName: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        active: document.getElementById('productStatus').value === 'true'
    };

    try {
        const response = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            alert('Product created successfully!');
            document.getElementById('productForm').reset();
            show('productsView');
            loadProducts();
        } else {
            const error = await response.text();
            alert('Error: ' + error);
        }
    } catch (error) {
        console.error('Error creating product:', error);
        alert('Connection error');
    }
}

// Submit ticket form
async function submitTicket(event) {
    event.preventDefault();

    const ticketData = {
        productId: parseInt(document.getElementById('ticketProduct').value),
        subject: document.getElementById('ticketSubject').value,
        description: document.getElementById('ticketDescription').value
    };

    try {
        const response = await fetch(`${API_BASE}/tickets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticketData)
        });

        if (response.ok) {
            alert('Ticket created successfully!');
            document.getElementById('ticketForm').reset();
            show('ticketsView');
            loadTickets();
        } else {
            const error = await response.text();
            alert('Error: ' + error);
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        alert('Connection error');
    }
}
// Open ticket modal
function openTicketModal() {
    loadProductsForTicketModal();
    const modal = document.getElementById('ticketModal');
    const overlay = document.getElementById('ticketModalOverlay');
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close ticket modal
function closeTicketModal() {
    const modal = document.getElementById('ticketModal');
    const overlay = document.getElementById('ticketModalOverlay');
    modal.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('createTicketForm').reset();
}

// Load products for ticket modal dropdown
async function loadProductsForTicketModal() {
    try {
        const response = await fetch(`${API_BASE}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            const select = document.getElementById('modalTicketProduct');
            select.innerHTML = '<option value="">Select a product</option>' +
                products.map(p => `<option value="${p.id}">${p.productName} (${p.productId})</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Submit ticket modal
async function submitTicketModal(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitTicketBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const ticketData = {
        productId: parseInt(document.getElementById('modalTicketProduct').value),
        subject: document.getElementById('modalTicketSubject').value,
        description: document.getElementById('modalTicketDescription').value
    };

    try {
        const response = await fetch(`${API_BASE}/tickets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticketData)
        });

        if (response.ok) {
            showSuccessAlert('Success', 'Ticket submitted successfully!');
            closeTicketModal();
            loadTickets();
        } else {
            const error = await response.text();
            showErrorAlert('Error', error || 'Failed to create ticket');
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        showErrorAlert('Connection Error', 'Could not connect to server');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Alert Dialog functionality
let alertDialogResolver = null;

function showAlertDialog(title, description, actionText = 'Continue', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        alertDialogResolver = resolve;
        
        // Set content
        document.getElementById('alertDialogTitle').textContent = title;
        document.getElementById('alertDialogDescription').textContent = description;
        document.getElementById('alertDialogAction').textContent = actionText;
        document.getElementById('alertDialogCancel').textContent = cancelText;
        
        // Show dialog
        const overlay = document.getElementById('alertDialogOverlay');
        const content = document.getElementById('alertDialogContent');
        
        overlay.classList.add('open');
        content.classList.add('open');
        document.body.style.overflow = 'hidden';
    });
}

function closeAlertDialog(confirmed) {
    const overlay = document.getElementById('alertDialogOverlay');
    const content = document.getElementById('alertDialogContent');
    
    overlay.classList.remove('open');
    content.classList.remove('open');
    document.body.style.overflow = '';
    
    if (alertDialogResolver) {
        alertDialogResolver(confirmed);
        alertDialogResolver = null;
    }
}

// Alert Component (notification banners)
function createAlert(options) {
    const {
        variant = 'default', // default, destructive, success, warning, info
        title,
        description,
        icon,
        duration = 0, // 0 means no auto-dismiss
        container = document.getElementById('alertContainer')
    } = options;

    const alert = document.createElement('div');
    alert.className = `alert alert-${variant}`;
    
    if (icon) {
        alert.classList.add('alert-with-icon');
    }

    let html = '';

    // Add icon if provided
    if (icon) {
        html += `<svg class="alert-icon" viewBox="0 0 24 24">${icon}</svg>`;
    }

    // Add title if provided
    if (title) {
        html += `<h5 class="alert-title">${title}</h5>`;
    }

    // Add description
    if (description) {
        html += `<div class="alert-description">${description}</div>`;
    }

    alert.innerHTML = html;

    // Add to container
    if (container) {
        container.appendChild(alert);

        // Auto-dismiss if duration is set
        if (duration > 0) {
            setTimeout(() => {
                removeAlert(alert);
            }, duration);
        }
    }

    return alert;
}

function removeAlert(alertElement) {
    alertElement.classList.add('removing');
    setTimeout(() => {
        alertElement.remove();
    }, 300); // Match animation duration
}

// Predefined alert icons
const alertIcons = {
    error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
};

// Helper functions for common alert types
function showAlert(title, description, duration = 5000) {
    return createAlert({ variant: 'default', title, description, duration });
}

function showSuccessAlert(title, description, duration = 5000) {
    return createAlert({ 
        variant: 'success', 
        title, 
        description, 
        icon: alertIcons.success,
        duration 
    });
}

function showErrorAlert(title, description, duration = 5000) {
    return createAlert({ 
        variant: 'destructive', 
        title, 
        description, 
        icon: alertIcons.error,
        duration 
    });
}

function showWarningAlert(title, description, duration = 5000) {
    return createAlert({ 
        variant: 'warning', 
        title, 
        description, 
        icon: alertIcons.warning,
        duration 
    });
}

function showInfoAlert(title, description, duration = 5000) {
    return createAlert({ 
        variant: 'info', 
        title, 
        description, 
        icon: alertIcons.info,
        duration 
    });
}

// Aspect Ratio utilities
function createAspectRatio(ratio, content, className = '') {
    const container = document.createElement('div');
    container.className = `aspect-ratio ${className}`;
    
    // Calculate padding-bottom percentage
    let paddingBottom;
    if (typeof ratio === 'number') {
        paddingBottom = (1 / ratio) * 100;
    } else if (typeof ratio === 'string') {
        // Handle "16/9" or "16:9" format
        const parts = ratio.split(/[/:]/);
        if (parts.length === 2) {
            paddingBottom = (parseFloat(parts[1]) / parseFloat(parts[0])) * 100;
        }
    }
    
    if (paddingBottom) {
        container.style.setProperty('--aspect-ratio', `${paddingBottom}%`);
    }
    
    if (content) {
        if (typeof content === 'string') {
            container.innerHTML = content;
        } else if (content instanceof Element) {
            container.appendChild(content);
        }
    }
    
    return container;
}

// Aspect ratio presets
const AspectRatios = {
    SQUARE: 1,       // 1:1
    VIDEO: 16/9,     // 16:9
    WIDE: 21/9,      // 21:9
    PORTRAIT: 3/4,   // 3:4
    CLASSIC: 4/3,    // 4:3
    GOLDEN: 16/10    // 16:10
};

// Helper functions for common ratios
function createSquareRatio(content) {
    return createAspectRatio(AspectRatios.SQUARE, content, 'aspect-ratio-square');
}

function createVideoRatio(content) {
    return createAspectRatio(AspectRatios.VIDEO, content, 'aspect-ratio-video');
}

function createWideRatio(content) {
    return createAspectRatio(AspectRatios.WIDE, content, 'aspect-ratio-wide');
}

function createPortraitRatio(content) {
    return createAspectRatio(AspectRatios.PORTRAIT, content, 'aspect-ratio-portrait');
}

function createClassicRatio(content) {
    return createAspectRatio(AspectRatios.CLASSIC, content, 'aspect-ratio-classic');
}

// Avatar Component
function createAvatar(options) {
    const {
        src,
        alt = 'Avatar',
        fallback,
        size = 'md', // sm, md, lg, xl
        status, // online, offline, away, busy
        className = ''
    } = options;

    const avatar = document.createElement('div');
    avatar.className = `avatar avatar-${size} ${status ? 'avatar-with-status' : ''} ${className}`;

    if (src) {
        const img = document.createElement('img');
        img.className = 'avatar-image';
        img.src = src;
        img.alt = alt;
        
        // Add fallback on error
        img.onerror = function() {
            this.remove();
            avatar.appendChild(createAvatarFallback(fallback));
        };
        
        avatar.appendChild(img);
    } else {
        avatar.appendChild(createAvatarFallback(fallback));
    }

    // Add status indicator
    if (status) {
        const statusDot = document.createElement('div');
        statusDot.className = `avatar-status ${status}`;
        avatar.appendChild(statusDot);
    }

    return avatar;
}

function createAvatarFallback(content) {
    const fallback = document.createElement('div');
    fallback.className = 'avatar-fallback';
    
    if (typeof content === 'string') {
        // Check if it's HTML or text
        if (content.includes('<')) {
            fallback.innerHTML = content;
        } else {
            // Use initials
            fallback.textContent = content;
        }
    } else if (content instanceof Element) {
        fallback.appendChild(content);
    } else {
        // Default user icon
        fallback.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }
    
    return fallback;
}

// Helper function to get initials from name
function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Avatar preset functions
function createUserAvatar(user, size = 'md') {
    return createAvatar({
        src: user.avatar || user.avatarUrl,
        fallback: getInitials(user.name || user.username),
        size: size,
        status: user.status,
        alt: user.name || user.username
    });
}

function createAvatarWithInitials(name, size = 'md') {
    return createAvatar({
        fallback: getInitials(name),
        size: size
    });
}

function createAvatarWithIcon(iconSvg, size = 'md') {
    return createAvatar({
        fallback: iconSvg,
        size: size
    });
}
""  
"// Badge Component Functions"  
"function createBadge(text, variant = 'default', options = {}) {" 
    const {
        size = null, // sm, lg
        withDot = false,
        className = '',
        onClick = null
    } = options;

    const badge = document.createElement('span');
    let classes = `badge badge-${variant}`;
    
    if (size) {
        classes += ` badge-${size}`;
    }
    
    if (withDot) {
        classes += ' badge-with-dot';
    }
    
    if (className) {
        classes += ` ${className}`;
    }
    
    badge.className = classes;
    
    if (withDot) {
        const dot = document.createElement('span');
        dot.className = 'badge-dot';
        badge.appendChild(dot);
    }
    
    const textNode = document.createTextNode(text);
    badge.appendChild(textNode);
    
    if (onClick) {
        badge.style.cursor = 'pointer';
        badge.addEventListener('click', onClick);
    }
    
    return badge;
}

// Badge Helper Functions
function createStatusBadge(status) {
    const statusMap = {
        'active': { text: 'Active', variant: 'success', withDot: true },
        'inactive': { text: 'Inactive', variant: 'secondary', withDot: true },
        'pending': { text: 'Pending', variant: 'warning', withDot: true },
        'error': { text: 'Error', variant: 'destructive', withDot: true },
        'success': { text: 'Success', variant: 'success', withDot: true },
        'open': { text: 'Open', variant: 'info', withDot: true },
        'closed': { text: 'Closed', variant: 'secondary', withDot: true },
        'in-progress': { text: 'In Progress', variant: 'warning', withDot: true }
    };

    const config = statusMap[status.toLowerCase()] || { text: status, variant: 'default' };
    return createBadge(config.text, config.variant, { withDot: config.withDot });
}

function createPriorityBadge(priority) {
    const priorityMap = {
        'high': { text: 'High', variant: 'destructive' },
        'medium': { text: 'Medium', variant: 'warning' },
        'low': { text: 'Low', variant: 'success' },
        'critical': { text: 'Critical', variant: 'destructive' },
        'urgent': { text: 'Urgent', variant: 'warning' }
    };

    const config = priorityMap[priority.toLowerCase()] || { text: priority, variant: 'default' };
    return createBadge(config.text, config.variant);
}

function createCountBadge(count, variant = 'default') {
    return createBadge(count.toString(), variant, { size: 'sm' });
}

// Breadcrumb Component Functions
function createBreadcrumb(options = {}) {
    const { className = '', ariaLabel = 'breadcrumb' } = options;
    
    const nav = document.createElement('nav');
    nav.className = `breadcrumb ${className}`;
    nav.setAttribute('aria-label', ariaLabel);
    
    return nav;
}

function createBreadcrumbList(className = '') {
    const ol = document.createElement('ol');
    ol.className = `breadcrumb-list ${className}`;
    
    return ol;
}

function createBreadcrumbItem(className = '') {
    const li = document.createElement('li');
    li.className = `breadcrumb-item ${className}`;
    
    return li;
}

function createBreadcrumbLink(options = {}) {
    const { href = '#', text, onClick, className = '' } = options;
    
    const link = document.createElement('a');
    link.className = `breadcrumb-link ${className}`;
    link.href = href;
    
    if (text) {
        link.textContent = text;
    }
    
    if (onClick) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            onClick(e);
        });
    }
    
    return link;
}

function createBreadcrumbPage(text, className = '') {
    const span = document.createElement('span');
    span.className = `breadcrumb-page ${className}`;
    span.setAttribute('role', 'link');
    span.setAttribute('aria-disabled', 'true');
    span.setAttribute('aria-current', 'page');
    span.textContent = text;
    
    return span;
}

function createBreadcrumbSeparator(customIcon = null, className = '') {
    const li = document.createElement('li');
    li.className = `breadcrumb-separator ${className}`;
    li.setAttribute('role', 'presentation');
    li.setAttribute('aria-hidden', 'true');
    
    if (customIcon) {
        if (typeof customIcon === 'string') {
            li.innerHTML = customIcon;
        } else {
            li.appendChild(customIcon);
        }
    } else {
        // Default ChevronRight icon
        li.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }
    
    return li;
}

function createBreadcrumbEllipsis(onClick = null, className = '') {
    const span = document.createElement('span');
    span.className = `breadcrumb-ellipsis ${className}`;
    span.setAttribute('role', 'presentation');
    span.setAttribute('aria-hidden', 'true');
    
    span.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="19" cy="12" r="1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="5" cy="12" r="1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="sr-only">More</span>
    `;
    
    if (onClick) {
        span.style.cursor = 'pointer';
        span.addEventListener('click', onClick);
    }
    
    return span;
}

// Breadcrumb Helper Functions
function createSimpleBreadcrumb(items, options = {}) {
    const { separator = null, onNavigate = null } = options;
    
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();
    
    items.forEach((item, index) => {
        const breadcrumbItem = createBreadcrumbItem();
        
        if (index === items.length - 1) {
            // Last item is current page
            breadcrumbItem.appendChild(createBreadcrumbPage(item.label));
        } else {
            // Other items are links
            const link = createBreadcrumbLink({
                text: item.label,
                href: item.href || '#',
                onClick: onNavigate ? () => onNavigate(item) : null
            });
            breadcrumbItem.appendChild(link);
        }
        
        list.appendChild(breadcrumbItem);
        
        // Add separator between items (not after last)
        if (index < items.length - 1) {
            list.appendChild(createBreadcrumbSeparator(separator));
        }
    });
    
    nav.appendChild(list);
    return nav;
}

function createCollapsibleBreadcrumb(items, maxVisible = 3, options = {}) {
    const { separator = null, onNavigate = null } = options;
    
    if (items.length <= maxVisible) {
        return createSimpleBreadcrumb(items, options);
    }
    
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();
    
    // Always show first item
    const firstItem = createBreadcrumbItem();
    const firstLink = createBreadcrumbLink({
        text: items[0].label,
        href: items[0].href || '#',
        onClick: onNavigate ? () => onNavigate(items[0]) : null
    });
    firstItem.appendChild(firstLink);
    list.appendChild(firstItem);
    list.appendChild(createBreadcrumbSeparator(separator));
    
    // Add ellipsis for hidden items
    const ellipsisItem = createBreadcrumbItem();
    const hiddenItems = items.slice(1, items.length - (maxVisible - 2));
    const ellipsis = createBreadcrumbEllipsis(() => {
        // Could show dropdown menu with hidden items
        console.log('Hidden items:', hiddenItems);
    });
    ellipsisItem.appendChild(ellipsis);
    list.appendChild(ellipsisItem);
    list.appendChild(createBreadcrumbSeparator(separator));
    
    // Show last few items
    const visibleEndItems = items.slice(items.length - (maxVisible - 2));
    visibleEndItems.forEach((item, index) => {
        const breadcrumbItem = createBreadcrumbItem();
        
        if (index === visibleEndItems.length - 1) {
            // Last item is current page
            breadcrumbItem.appendChild(createBreadcrumbPage(item.label));
        } else {
            const link = createBreadcrumbLink({
                text: item.label,
                href: item.href || '#',
                onClick: onNavigate ? () => onNavigate(item) : null
            });
            breadcrumbItem.appendChild(link);
        }
        
        list.appendChild(breadcrumbItem);
        
        if (index < visibleEndItems.length - 1) {
            list.appendChild(createBreadcrumbSeparator(separator));
        }
    });
    
    nav.appendChild(list);
    return nav;
}

function createBreadcrumbFromPath(path, baseUrl = '', onNavigate = null) {
    const segments = path.split('/').filter(segment => segment.length > 0);
    
    const items = segments.map((segment, index) => {
        const href = baseUrl + '/' + segments.slice(0, index + 1).join('/');
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        
        return { label, href, segment };
    });
    
    return createSimpleBreadcrumb(items, { onNavigate });
}

// Button Component Functions
function createButton(options = {}) {
    const {
        text = '',
        variant = 'default', // default, destructive, outline, secondary, ghost, link
        size = 'default', // default, sm, lg, icon
        type = 'button',
        icon = null,
        iconPosition = 'left', // left, right
        onClick = null,
        disabled = false,
        loading = false,
        className = '',
        ...attrs
    } = options;

    const button = document.createElement('button');
    button.type = type;
    
    // Build class names
    let classes = 'btn';
    classes += ` btn-${variant}`;
    classes += size === 'default' ? ' btn-default-size' : ` btn-${size}`;
    
    if (loading) {
        classes += ' btn-loading';
    }
    
    if (className) {
        classes += ` ${className}`;
    }
    
    button.className = classes;
    
    // Set disabled state
    if (disabled || loading) {
        button.disabled = true;
    }
    
    // Add icon (left)
    if (icon && iconPosition === 'left' && !loading) {
        if (typeof icon === 'string') {
            const iconSpan = document.createElement('span');
            iconSpan.innerHTML = icon;
            button.appendChild(iconSpan);
        } else {
            button.appendChild(icon);
        }
    }
    
    // Add text
    if (text && !loading) {
        button.appendChild(document.createTextNode(text));
    }
    
    // Add icon (right)
    if (icon && iconPosition === 'right' && !loading) {
        if (typeof icon === 'string') {
            const iconSpan = document.createElement('span');
            iconSpan.innerHTML = icon;
            button.appendChild(iconSpan);
        } else {
            button.appendChild(icon);
        }
    }
    
    // Loading state shows spinner (handled by CSS)
    if (loading && text) {
        button.appendChild(document.createTextNode(text));
    }
    
    // Add click handler
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    
    // Add any additional attributes
    Object.keys(attrs).forEach(key => {
        if (key.startsWith('data-') || key.startsWith('aria-')) {
            button.setAttribute(key, attrs[key]);
        }
    });
    
    return button;
}

// Button Helper Functions
function createPrimaryButton(text, onClick, options = {}) {
    return createButton({
        text,
        onClick,
        variant: 'default',
        ...options
    });
}

function createSecondaryButton(text, onClick, options = {}) {
    return createButton({
        text,
        onClick,
        variant: 'secondary',
        ...options
    });
}

function createDestructiveButton(text, onClick, options = {}) {
    return createButton({
        text,
        onClick,
        variant: 'destructive',
        ...options
    });
}

function createOutlineButton(text, onClick, options = {}) {
    return createButton({
        text,
        onClick,
        variant: 'outline',
        ...options
    });
}

function createGhostButton(text, onClick, options = {}) {
    return createButton({
        text,
        onClick,
        variant: 'ghost',
        ...options
    });
}

function createLinkButton(text, onClick, options = {}) {
    return createButton({
        text,
        onClick,
        variant: 'link',
        ...options
    });
}

function createIconButton(icon, onClick, options = {}) {
    return createButton({
        icon,
        onClick,
        size: 'icon',
        ...options
    });
}

function createLoadingButton(text, variant = 'default', size = 'default') {
    return createButton({
        text,
        variant,
        size,
        loading: true
    });
}

// Button with icon helpers
function createButtonWithIcon(text, icon, onClick, options = {}) {
    return createButton({
        text,
        icon,
        onClick,
        ...options
    });
}

// Common icon SVGs
const ButtonIcons = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/></svg>',
    
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/></svg>',
    
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="17 21 17 13 7 13 7 21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="7 3 7 8 15 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="7 10 12 15 17 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="15" x2="12" y2="3" stroke-width="2" stroke-linecap="round"/></svg>',
    
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="17 8 12 3 7 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="3" x2="12" y2="15" stroke-width="2" stroke-linecap="round"/></svg>',
    
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="23 4 23 10 17 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="1 20 1 14 7 14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 1v6m0 6v6m5.196-15.196l-4.242 4.242m-1.414 1.414l-4.242 4.242m12.728 0l-4.242-4.242m-1.414-1.414l-4.242-4.242" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    chevronUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="18 15 12 9 6 15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

// Button state management helpers
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        button.dataset.originalDisabled = button.disabled;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = button.dataset.originalDisabled === 'true';
    }
}

function setButtonDisabled(button, disabled = true) {
    button.disabled = disabled;
}

// Button group helpers
function createButtonGroup(buttons, attached = false) {
    const group = document.createElement('div');
    group.className = attached ? 'btn-group-attached' : 'btn-group';
    
    buttons.forEach(button => {
        group.appendChild(button);
    });
    
    return group;
}

// Calendar Component Functions
function createCalendar(options = {}) {
    const {
        selected = null, // Date or { from: Date, to: Date } for range
        mode = 'single', // 'single' or 'range'
        onSelect = null,
        disabled = null, // Date, Date[], or function(date) => boolean
        showOutsideDays = true,
        numberOfMonths = 1,
        defaultMonth = new Date(),
        className = ''
    } = options;

    const state = {
        currentMonth: new Date(defaultMonth.getFullYear(), defaultMonth.getMonth(), 1),
        selected: selected,
        mode: mode,
        rangeStart: mode === 'range' && selected?.from ? selected.from : null,
        rangeEnd: mode === 'range' && selected?.to ? selected.to : null
    };

    const calendar = document.createElement('div');
    calendar.className = `calendar ${className}`;

    const months = document.createElement('div');
    months.className = 'calendar-months';

    for (let i = 0; i < numberOfMonths; i++) {
        const monthDate = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + i, 1);
        const monthElement = createMonth(monthDate, state, onSelect, disabled, showOutsideDays, numberOfMonths > 1);
        months.appendChild(monthElement);
    }

    calendar.appendChild(months);
    calendar._state = state;
    calendar._refresh = function() {
        months.innerHTML = '';
        for (let i = 0; i < numberOfMonths; i++) {
            const monthDate = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + i, 1);
            const monthElement = createMonth(monthDate, state, onSelect, disabled, showOutsideDays, numberOfMonths > 1);
            months.appendChild(monthElement);
        }
    };

    return calendar;
}

function createMonth(date, state, onSelect, disabled, showOutsideDays, hideNav) {
    const month = document.createElement('div');
    month.className = 'calendar-month';

    // Caption with navigation
    const caption = createCaption(date, state, hideNav);
    month.appendChild(caption);

    // Calendar table
    const table = createMonthTable(date, state, onSelect, disabled, showOutsideDays);
    month.appendChild(table);

    return month;
}

function createCaption(date, state, hideNav) {
    const caption = document.createElement('div');
    caption.className = 'calendar-caption';

    // Month/Year label
    const label = document.createElement('div');
    label.className = 'calendar-caption-label';
    label.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    caption.appendChild(label);

    if (!hideNav) {
        // Previous button
        const prevButton = createButton({
            icon: ButtonIcons.chevronLeft,
            variant: 'outline',
            size: 'icon',
            className: 'calendar-nav-button calendar-nav-button-previous',
            onClick: (e) => {
                e.preventDefault();
                state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
                const calendar = caption.closest('.calendar');
                if (calendar && calendar._refresh) {
                    calendar._refresh();
                }
            }
        });
        prevButton.style.height = '28px';
        prevButton.style.width = '28px';
        caption.appendChild(prevButton);

        // Next button
        const nextButton = createButton({
            icon: ButtonIcons.chevronRight,
            variant: 'outline',
            size: 'icon',
            className: 'calendar-nav-button calendar-nav-button-next',
            onClick: (e) => {
                e.preventDefault();
                state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
                const calendar = caption.closest('.calendar');
                if (calendar && calendar._refresh) {
                    calendar._refresh();
                }
            }
        });
        nextButton.style.height = '28px';
        nextButton.style.width = '28px';
        caption.appendChild(nextButton);
    }

    return caption;
}

function createMonthTable(date, state, onSelect, disabled, showOutsideDays) {
    const table = document.createElement('div');
    table.className = 'calendar-table';

    // Header row (days of week)
    const headRow = document.createElement('div');
    headRow.className = 'calendar-head-row';
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    dayNames.forEach(day => {
        const headCell = document.createElement('div');
        headCell.className = 'calendar-head-cell';
        headCell.textContent = day;
        headRow.appendChild(headCell);
    });
    table.appendChild(headRow);

    // Get days for the month
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let dayCount = 1;
    let nextMonthDay = 1;

    // Create rows (6 weeks max)
    for (let week = 0; week < 6; week++) {
        const row = document.createElement('div');
        row.className = 'calendar-row';

        for (let day = 0; day < 7; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';

            const weekDay = week * 7 + day;

            if (weekDay < firstDay) {
                // Previous month days
                if (showOutsideDays) {
                    const prevDay = daysInPrevMonth - firstDay + weekDay + 1;
                    const prevDate = new Date(year, month - 1, prevDay);
                    const dayButton = createDayButton(prevDate, state, onSelect, disabled, true);
                    cell.appendChild(dayButton);
                }
            } else if (dayCount <= daysInMonth) {
                // Current month days
                const currentDate = new Date(year, month, dayCount);
                const dayButton = createDayButton(currentDate, state, onSelect, disabled, false);
                cell.appendChild(dayButton);
                dayCount++;
            } else {
                // Next month days
                if (showOutsideDays) {
                    const nextDate = new Date(year, month + 1, nextMonthDay);
                    const dayButton = createDayButton(nextDate, state, onSelect, disabled, true);
                    cell.appendChild(dayButton);
                    nextMonthDay++;
                }
            }

            row.appendChild(cell);
        }

        table.appendChild(row);

        // Stop if we've shown all days and don't need more rows
        if (dayCount > daysInMonth && !showOutsideDays) break;
    }

    return table;
}

function createDayButton(date, state, onSelect, disabled, isOutside) {
    const button = document.createElement('button');
    button.className = 'calendar-day';
    button.textContent = date.getDate();
    button.type = 'button';

    // Check if today
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday && !isOutside) {
        button.classList.add('calendar-day-today');
    }

    // Check if outside
    if (isOutside) {
        button.classList.add('calendar-day-outside');
    }

    // Check if disabled
    const isDisabled = isDateDisabled(date, disabled);
    if (isDisabled) {
        button.classList.add('calendar-day-disabled');
        button.disabled = true;
    }

    // Check if selected
    const isSelected = isDateSelected(date, state);
    if (isSelected) {
        button.classList.add('calendar-day-selected');
        button.setAttribute('aria-selected', 'true');
    }

    // Check if in range (for range mode)
    if (state.mode === 'range' && state.rangeStart && state.rangeEnd) {
        if (date > state.rangeStart && date < state.rangeEnd) {
            button.classList.add('calendar-day-range-middle');
            button.setAttribute('aria-selected', 'true');
        }
    }

    // Click handler
    button.addEventListener('click', (e) => {
        e.preventDefault();
        if (isDisabled) return;

        if (state.mode === 'single') {
            state.selected = date;
            if (onSelect) onSelect(date);
        } else if (state.mode === 'range') {
            if (!state.rangeStart || (state.rangeStart && state.rangeEnd)) {
                // Start new range
                state.rangeStart = date;
                state.rangeEnd = null;
                state.selected = { from: date, to: null };
            } else {
                // Complete range
                if (date < state.rangeStart) {
                    state.rangeEnd = state.rangeStart;
                    state.rangeStart = date;
                } else {
                    state.rangeEnd = date;
                }
                state.selected = { from: state.rangeStart, to: state.rangeEnd };
            }
            if (onSelect) onSelect(state.selected);
        }

        // Refresh calendar
        const calendar = button.closest('.calendar');
        if (calendar && calendar._refresh) {
            calendar._refresh();
        }
    });

    return button;
}

function isDateDisabled(date, disabled) {
    if (!disabled) return false;

    if (disabled instanceof Date) {
        return date.toDateString() === disabled.toDateString();
    }

    if (Array.isArray(disabled)) {
        return disabled.some(d => date.toDateString() === d.toDateString());
    }

    if (typeof disabled === 'function') {
        return disabled(date);
    }

    return false;
}

function isDateSelected(date, state) {
    if (state.mode === 'single' && state.selected) {
        return date.toDateString() === state.selected.toDateString();
    }

    if (state.mode === 'range') {
        if (state.rangeStart && date.toDateString() === state.rangeStart.toDateString()) {
            return true;
        }
        if (state.rangeEnd && date.toDateString() === state.rangeEnd.toDateString()) {
            return true;
        }
    }

    return false;
}

// Calendar Helper Functions
function createDatePicker(options = {}) {
    const {
        selected = null,
        onSelect = null,
        placeholder = 'Pick a date',
        disabled = null,
        className = ''
    } = options;

    const container = document.createElement('div');
    container.className = `date-picker ${className}`;
    container.style.position = 'relative';

    // Input field
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.placeholder = placeholder;
    input.className = 'form-control';
    input.value = selected ? formatDate(selected) : '';

    // Calendar popup
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.top = '100%';
    popup.style.left = '0';
    popup.style.marginTop = '4px';
    popup.style.zIndex = '1000';
    popup.style.display = 'none';

    const calendar = createCalendar({
        selected: selected,
        onSelect: (date) => {
            input.value = formatDate(date);
            popup.style.display = 'none';
            if (onSelect) onSelect(date);
        },
        disabled: disabled
    });

    popup.appendChild(calendar);

    input.addEventListener('click', () => {
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            popup.style.display = 'none';
        }
    });

    container.appendChild(input);
    container.appendChild(popup);

    return container;
}

function createDateRangePicker(options = {}) {
    const {
        selected = null,
        onSelect = null,
        placeholder = 'Pick a date range',
        disabled = null,
        className = ''
    } = options;

    const container = document.createElement('div');
    container.className = `date-range-picker ${className}`;
    container.style.position = 'relative';

    // Input field
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.placeholder = placeholder;
    input.className = 'form-control';
    
    if (selected?.from) {
        input.value = selected.to 
            ? `${formatDate(selected.from)} - ${formatDate(selected.to)}`
            : formatDate(selected.from);
    }

    // Calendar popup
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.top = '100%';
    popup.style.left = '0';
    popup.style.marginTop = '4px';
    popup.style.zIndex = '1000';
    popup.style.display = 'none';

    const calendar = createCalendar({
        selected: selected,
        mode: 'range',
        numberOfMonths: 2,
        onSelect: (range) => {
            if (range.from && range.to) {
                input.value = `${formatDate(range.from)} - ${formatDate(range.to)}`;
                popup.style.display = 'none';
            } else if (range.from) {
                input.value = formatDate(range.from);
            }
            if (onSelect) onSelect(range);
        },
        disabled: disabled
    });

    popup.appendChild(calendar);

    input.addEventListener('click', () => {
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            popup.style.display = 'none';
        }
    });

    container.appendChild(input);
    container.appendChild(popup);

    return container;
}

function formatDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Preset disabled date functions
const CalendarDisabled = {
    // Disable weekends
    weekends: (date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    },

    // Disable past dates
    past: (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    },

    // Disable future dates
    future: (date) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date > today;
    },

    // Disable dates before a specific date
    before: (beforeDate) => (date) => {
        return date < beforeDate;
    },

    // Disable dates after a specific date
    after: (afterDate) => (date) => {
        return date > afterDate;
    },

    // Disable date range
    range: (startDate, endDate) => (date) => {
        return date >= startDate && date <= endDate;
    }
};

// Card Component Functions
function createCard(options = {}) {
    const { className = '', ...attrs } = options;
    
    const card = document.createElement('div');
    card.className = `card ${className}`;
    
    // Add any additional attributes
    Object.keys(attrs).forEach(key => {
        if (key.startsWith('data-') || key.startsWith('aria-')) {
            card.setAttribute(key, attrs[key]);
        }
    });
    
    return card;
}

function createCardHeader(options = {}) {
    const { className = '' } = options;
    
    const header = document.createElement('div');
    header.className = `card-header ${className}`;
    
    return header;
}

function createCardTitle(text, options = {}) {
    const { className = '', tag = 'h3' } = options;
    
    const title = document.createElement(tag);
    title.className = `card-title ${className}`;
    title.textContent = text;
    
    return title;
}

function createCardDescription(text, options = {}) {
    const { className = '' } = options;
    
    const description = document.createElement('p');
    description.className = `card-description ${className}`;
    description.textContent = text;
    
    return description;
}

function createCardContent(options = {}) {
    const { className = '' } = options;
    
    const content = document.createElement('div');
    content.className = `card-content ${className}`;
    
    return content;
}

function createCardFooter(options = {}) {
    const { className = '' } = options;
    
    const footer = document.createElement('div');
    footer.className = `card-footer ${className}`;
    
    return footer;
}

// Card Helper Functions
function createSimpleCard(options = {}) {
    const {
        title,
        description,
        content,
        footer,
        className = ''
    } = options;

    const card = createCard({ className });

    if (title || description) {
        const header = createCardHeader();
        
        if (title) {
            const titleElement = typeof title === 'string' 
                ? createCardTitle(title) 
                : title;
            header.appendChild(titleElement);
        }
        
        if (description) {
            const descElement = typeof description === 'string'
                ? createCardDescription(description)
                : description;
            header.appendChild(descElement);
        }
        
        card.appendChild(header);
    }

    if (content) {
        const contentElement = createCardContent();
        
        if (typeof content === 'string') {
            contentElement.textContent = content;
        } else if (Array.isArray(content)) {
            content.forEach(item => {
                if (typeof item === 'string') {
                    contentElement.appendChild(document.createTextNode(item));
                } else {
                    contentElement.appendChild(item);
                }
            });
        } else {
            contentElement.appendChild(content);
        }
        
        card.appendChild(contentElement);
    }

    if (footer) {
        const footerElement = createCardFooter();
        
        if (typeof footer === 'string') {
            footerElement.textContent = footer;
        } else if (Array.isArray(footer)) {
            footer.forEach(item => {
                if (typeof item === 'string') {
                    footerElement.appendChild(document.createTextNode(item));
                } else {
                    footerElement.appendChild(item);
                }
            });
        } else {
            footerElement.appendChild(footer);
        }
        
        card.appendChild(footerElement);
    }

    return card;
}

function createStatCard(options = {}) {
    const {
        title,
        value,
        description,
        icon,
        trend,
        className = ''
    } = options;

    const card = createCard({ className });
    const header = createCardHeader();
    header.style.paddingBottom = '8px';

    // Title and icon row
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'center';
    titleRow.style.justifyContent = 'space-between';

    const titleElement = createCardTitle(title);
    titleElement.style.fontSize = '14px';
    titleElement.style.fontWeight = '500';
    titleElement.style.color = 'var(--text-muted)';
    titleRow.appendChild(titleElement);

    if (icon) {
        const iconSpan = document.createElement('span');
        iconSpan.style.color = 'var(--text-muted)';
        iconSpan.style.opacity = '0.7';
        if (typeof icon === 'string') {
            iconSpan.innerHTML = icon;
        } else {
            iconSpan.appendChild(icon);
        }
        titleRow.appendChild(iconSpan);
    }

    header.appendChild(titleRow);
    card.appendChild(header);

    // Content with value and trend
    const content = createCardContent();
    content.style.paddingTop = '0';

    const valueElement = document.createElement('div');
    valueElement.style.fontSize = '32px';
    valueElement.style.fontWeight = '700';
    valueElement.style.marginBottom = '4px';
    valueElement.textContent = value;
    content.appendChild(valueElement);

    if (description || trend) {
        const descRow = document.createElement('div');
        descRow.style.display = 'flex';
        descRow.style.alignItems = 'center';
        descRow.style.gap = '8px';
        descRow.style.fontSize = '14px';

        if (trend) {
            const trendBadge = createBadge(trend.value, trend.direction === 'up' ? 'success' : 'destructive', {
                size: 'sm'
            });
            descRow.appendChild(trendBadge);
        }

        if (description) {
            const descSpan = document.createElement('span');
            descSpan.style.color = 'var(--text-muted)';
            descSpan.textContent = description;
            descRow.appendChild(descSpan);
        }

        content.appendChild(descRow);
    }

    card.appendChild(content);

    return card;
}

function createActionCard(options = {}) {
    const {
        title,
        description,
        icon,
        actions,
        className = ''
    } = options;

    const card = createCard({ className });

    const header = createCardHeader();
    
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'flex-start';
    titleRow.style.gap = '12px';

    if (icon) {
        const iconContainer = document.createElement('div');
        iconContainer.style.width = '40px';
        iconContainer.style.height = '40px';
        iconContainer.style.borderRadius = '8px';
        iconContainer.style.background = 'var(--bg-secondary)';
        iconContainer.style.display = 'flex';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.justifyContent = 'center';
        iconContainer.style.flexShrink = '0';
        
        if (typeof icon === 'string') {
            iconContainer.innerHTML = icon;
        } else {
            iconContainer.appendChild(icon);
        }
        
        titleRow.appendChild(iconContainer);
    }

    const textContainer = document.createElement('div');
    textContainer.style.flex = '1';

    const titleElement = createCardTitle(title);
    titleElement.style.fontSize = '18px';
    textContainer.appendChild(titleElement);

    if (description) {
        const descElement = createCardDescription(description);
        descElement.style.marginTop = '4px';
        textContainer.appendChild(descElement);
    }

    titleRow.appendChild(textContainer);
    header.appendChild(titleRow);
    card.appendChild(header);

    if (actions && actions.length > 0) {
        const footer = createCardFooter();
        footer.style.gap = '8px';
        
        actions.forEach(action => {
            if (typeof action === 'string') {
                footer.appendChild(document.createTextNode(action));
            } else {
                footer.appendChild(action);
            }
        });
        
        card.appendChild(footer);
    }

    return card;
}

function createImageCard(options = {}) {
    const {
        imageSrc,
        imageAlt = '',
        title,
        description,
        content,
        footer,
        className = ''
    } = options;

    const card = createCard({ className });

    // Image
    if (imageSrc) {
        const imageContainer = document.createElement('div');
        imageContainer.style.width = '100%';
        imageContainer.style.aspectRatio = '16/9';
        imageContainer.style.overflow = 'hidden';
        imageContainer.style.borderRadius = '8px 8px 0 0';

        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = imageAlt;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';

        imageContainer.appendChild(img);
        card.appendChild(imageContainer);
    }

    // Header
    if (title || description) {
        const header = createCardHeader();
        
        if (title) {
            const titleElement = typeof title === 'string'
                ? createCardTitle(title)
                : title;
            titleElement.style.fontSize = '18px';
            header.appendChild(titleElement);
        }
        
        if (description) {
            const descElement = typeof description === 'string'
                ? createCardDescription(description)
                : description;
            header.appendChild(descElement);
        }
        
        card.appendChild(header);
    }

    // Content
    if (content) {
        const contentElement = createCardContent();
        
        if (typeof content === 'string') {
            contentElement.textContent = content;
        } else {
            contentElement.appendChild(content);
        }
        
        card.appendChild(contentElement);
    }

    // Footer
    if (footer) {
        const footerElement = createCardFooter();
        
        if (Array.isArray(footer)) {
            footer.forEach(item => footerElement.appendChild(item));
        } else if (typeof footer === 'string') {
            footerElement.textContent = footer;
        } else {
            footerElement.appendChild(footer);
        }
        
        card.appendChild(footerElement);
    }

    return card;
}

function createListCard(options = {}) {
    const {
        title,
        description,
        items = [],
        className = ''
    } = options;

    const card = createCard({ className });

    if (title || description) {
        const header = createCardHeader();
        
        if (title) {
            header.appendChild(createCardTitle(title));
        }
        
        if (description) {
            header.appendChild(createCardDescription(description));
        }
        
        card.appendChild(header);
    }

    const content = createCardContent();
    
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '12px';

    items.forEach((item, index) => {
        const listItem = document.createElement('div');
        listItem.style.display = 'flex';
        listItem.style.alignItems = 'center';
        listItem.style.gap = '12px';
        listItem.style.paddingBottom = '12px';
        
        if (index < items.length - 1) {
            listItem.style.borderBottom = '1px solid var(--border-color)';
        }

        if (item.icon) {
            const iconSpan = document.createElement('span');
            iconSpan.style.flexShrink = '0';
            if (typeof item.icon === 'string') {
                iconSpan.innerHTML = item.icon;
            } else {
                iconSpan.appendChild(item.icon);
            }
            listItem.appendChild(iconSpan);
        }

        const textContainer = document.createElement('div');
        textContainer.style.flex = '1';

        if (item.title) {
            const itemTitle = document.createElement('div');
            itemTitle.style.fontWeight = '500';
            itemTitle.style.fontSize = '14px';
            itemTitle.textContent = item.title;
            textContainer.appendChild(itemTitle);
        }

        if (item.description) {
            const itemDesc = document.createElement('div');
            itemDesc.style.fontSize = '13px';
            itemDesc.style.color = 'var(--text-muted)';
            itemDesc.textContent = item.description;
            textContainer.appendChild(itemDesc);
        }

        listItem.appendChild(textContainer);

        if (item.action) {
            listItem.appendChild(item.action);
        }

        list.appendChild(listItem);
    });

    content.appendChild(list);
    card.appendChild(content);

    return card;
}

// Carousel Component Functions
function createCarousel(options = {}) {
    const {
        orientation = 'horizontal', // 'horizontal' or 'vertical'
        loop = false,
        autoplay = false,
        autoplayDelay = 3000,
        showIndicators = true,
        showNavigation = true,
        className = '',
        onSlideChange = null
    } = options;

    const state = {
        currentIndex: 0,
        itemCount: 0,
        orientation: orientation,
        loop: loop,
        autoplay: autoplay,
        autoplayDelay: autoplayDelay,
        autoplayInterval: null,
        items: []
    };

    const carousel = document.createElement('div');
    carousel.className = `carousel ${className}`;
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-roledescription', 'carousel');
    carousel._state = state;

    // Viewport
    const viewport = document.createElement('div');
    viewport.className = 'carousel-viewport';

    // Container
    const container = document.createElement('div');
    container.className = `carousel-container carousel-container-${orientation}`;
    container._updateTransform = function() {
        const offset = orientation === 'horizontal' 
            ? -state.currentIndex * 100 
            : -state.currentIndex * 100;
        
        container.style.transform = orientation === 'horizontal'
            ? `translateX(${offset}%)`
            : `translateY(${offset}%)`;
    };

    viewport.appendChild(container);
    carousel.appendChild(viewport);

    // Navigation buttons
    if (showNavigation) {
        const prevButton = createButton({
            icon: ButtonIcons.chevronLeft,
            variant: 'outline',
            size: 'icon',
            className: `carousel-prev carousel-prev-${orientation}`,
            onClick: () => carousel._scrollPrev()
        });
        prevButton.style.width = '32px';
        prevButton.style.height = '32px';
        prevButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="sr-only">Previous slide</span>';
        carousel.appendChild(prevButton);
        carousel._prevButton = prevButton;

        const nextButton = createButton({
            icon: ButtonIcons.chevronRight,
            variant: 'outline',
            size: 'icon',
            className: `carousel-next carousel-next-${orientation}`,
            onClick: () => carousel._scrollNext()
        });
        nextButton.style.width = '32px';
        nextButton.style.height = '32px';
        nextButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="sr-only">Next slide</span>';
        carousel.appendChild(nextButton);
        carousel._nextButton = nextButton;
    }

    // Indicators
    if (showIndicators) {
        const indicators = document.createElement('div');
        indicators.className = 'carousel-indicators';
        carousel.appendChild(indicators);
        carousel._indicators = indicators;
    }

    // Methods
    carousel._container = container;
    carousel._viewport = viewport;
    
    carousel._updateIndicators = function() {
        if (!showIndicators || !carousel._indicators) return;
        
        carousel._indicators.innerHTML = '';
        
        for (let i = 0; i < state.itemCount; i++) {
            const indicator = document.createElement('button');
            indicator.className = `carousel-indicator ${i === state.currentIndex ? 'carousel-indicator-active' : ''}`;
            indicator.setAttribute('aria-label', `Go to slide ${i + 1}`);
            indicator.addEventListener('click', () => carousel._scrollTo(i));
            carousel._indicators.appendChild(indicator);
        }
    };

    carousel._updateButtons = function() {
        if (!showNavigation) return;
        
        const canScrollPrev = loop || state.currentIndex > 0;
        const canScrollNext = loop || state.currentIndex < state.itemCount - 1;
        
        if (carousel._prevButton) {
            carousel._prevButton.disabled = !canScrollPrev;
        }
        if (carousel._nextButton) {
            carousel._nextButton.disabled = !canScrollNext;
        }
    };

    carousel._scrollPrev = function() {
        if (state.currentIndex > 0) {
            carousel._scrollTo(state.currentIndex - 1);
        } else if (loop) {
            carousel._scrollTo(state.itemCount - 1);
        }
    };

    carousel._scrollNext = function() {
        if (state.currentIndex < state.itemCount - 1) {
            carousel._scrollTo(state.currentIndex + 1);
        } else if (loop) {
            carousel._scrollTo(0);
        }
    };

    carousel._scrollTo = function(index) {
        if (index < 0 || index >= state.itemCount) return;
        
        state.currentIndex = index;
        container._updateTransform();
        carousel._updateIndicators();
        carousel._updateButtons();
        
        if (onSlideChange) {
            onSlideChange(index);
        }

        // Restart autoplay
        if (autoplay) {
            carousel._stopAutoplay();
            carousel._startAutoplay();
        }
    };

    carousel._startAutoplay = function() {
        if (!autoplay) return;
        
        carousel._stopAutoplay();
        state.autoplayInterval = setInterval(() => {
            carousel._scrollNext();
        }, autoplayDelay);
    };

    carousel._stopAutoplay = function() {
        if (state.autoplayInterval) {
            clearInterval(state.autoplayInterval);
            state.autoplayInterval = null;
        }
    };

    carousel._addItem = function(item) {
        state.items.push(item);
        state.itemCount = state.items.length;
        container.appendChild(item);
        carousel._updateIndicators();
        carousel._updateButtons();
    };

    // Keyboard navigation
    carousel.addEventListener('keydown', (e) => {
        if (orientation === 'horizontal') {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                carousel._scrollPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                carousel._scrollNext();
            }
        } else {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                carousel._scrollPrev();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                carousel._scrollNext();
            }
        }
    });

    carousel.setAttribute('tabindex', '0');

    // Pause autoplay on hover
    if (autoplay) {
        carousel.addEventListener('mouseenter', () => carousel._stopAutoplay());
        carousel.addEventListener('mouseleave', () => carousel._startAutoplay());
    }

    return carousel;
}

function createCarouselItem(content, options = {}) {
    const { orientation = 'horizontal', className = '' } = options;
    
    const item = document.createElement('div');
    item.className = `carousel-item carousel-item-${orientation} ${className}`;
    item.setAttribute('role', 'group');
    item.setAttribute('aria-roledescription', 'slide');
    
    if (typeof content === 'string') {
        item.innerHTML = content;
    } else if (content instanceof Element) {
        item.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(child => {
            if (typeof child === 'string') {
                item.innerHTML += child;
            } else {
                item.appendChild(child);
            }
        });
    }
    
    return item;
}

// Carousel Helper Functions
function createSimpleCarousel(items, options = {}) {
    const {
        orientation = 'horizontal',
        loop = false,
        autoplay = false,
        autoplayDelay = 3000,
        showIndicators = true,
        showNavigation = true,
        className = ''
    } = options;

    const carousel = createCarousel({
        orientation,
        loop,
        autoplay,
        autoplayDelay,
        showIndicators,
        showNavigation,
        className
    });

    items.forEach(item => {
        const carouselItem = createCarouselItem(item, { orientation });
        carousel._addItem(carouselItem);
    });

    // Start autoplay if enabled
    if (autoplay) {
        setTimeout(() => carousel._startAutoplay(), 100);
    }

    return carousel;
}

function createImageCarousel(images, options = {}) {
    const {
        aspectRatio = '16/9',
        altTexts = [],
        captions = [],
        ...carouselOptions
    } = options;

    const items = images.map((imageSrc, index) => {
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.aspectRatio = aspectRatio;
        container.style.overflow = 'hidden';
        container.style.borderRadius = '8px';
        container.style.position = 'relative';

        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = altTexts[index] || `Slide ${index + 1}`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';

        container.appendChild(img);

        if (captions[index]) {
            const caption = document.createElement('div');
            caption.style.position = 'absolute';
            caption.style.bottom = '0';
            caption.style.left = '0';
            caption.style.right = '0';
            caption.style.padding = '16px';
            caption.style.background = 'rgba(0, 0, 0, 0.6)';
            caption.style.color = 'white';
            caption.style.fontSize = '14px';
            caption.textContent = captions[index];
            container.appendChild(caption);
        }

        return container;
    });

    return createSimpleCarousel(items, carouselOptions);
}

function createCardCarousel(cards, options = {}) {
    const {
        itemsPerView = 1,
        gap = 16,
        ...carouselOptions
    } = options;

    const carousel = createCarousel(carouselOptions);

    if (itemsPerView > 1) {
        // Group cards into slides
        const slides = [];
        for (let i = 0; i < cards.length; i += itemsPerView) {
            const slideCards = cards.slice(i, i + itemsPerView);
            
            const slide = document.createElement('div');
            slide.style.display = 'grid';
            slide.style.gridTemplateColumns = `repeat(${Math.min(itemsPerView, slideCards.length)}, 1fr)`;
            slide.style.gap = `${gap}px`;
            slide.style.padding = '0 4px';
            
            slideCards.forEach(card => slide.appendChild(card));
            slides.push(slide);
        }

        slides.forEach(slide => {
            const item = createCarouselItem(slide, { orientation: carouselOptions.orientation });
            carousel._addItem(item);
        });
    } else {
        // One card per slide
        cards.forEach(card => {
            const item = createCarouselItem(card, { orientation: carouselOptions.orientation });
            carousel._addItem(item);
        });
    }

    if (carouselOptions.autoplay) {
        setTimeout(() => carousel._startAutoplay(), 100);
    }

    return carousel;
}

function createTestimonialCarousel(testimonials, options = {}) {
    const items = testimonials.map(testimonial => {
        const container = document.createElement('div');
        container.style.textAlign = 'center';
        container.style.padding = '32px';

        // Quote
        const quote = document.createElement('blockquote');
        quote.style.fontSize = '18px';
        quote.style.fontStyle = 'italic';
        quote.style.marginBottom = '24px';
        quote.style.color = 'var(--text-primary)';
        quote.textContent = `"${testimonial.quote}"`;
        container.appendChild(quote);

        // Author info
        const authorContainer = document.createElement('div');
        authorContainer.style.display = 'flex';
        authorContainer.style.alignItems = 'center';
        authorContainer.style.justifyContent = 'center';
        authorContainer.style.gap = '12px';

        if (testimonial.avatar) {
            const avatar = createAvatar({
                src: testimonial.avatar,
                alt: testimonial.author,
                size: 'md'
            });
            authorContainer.appendChild(avatar);
        }

        const authorInfo = document.createElement('div');
        authorInfo.style.textAlign = 'left';

        const authorName = document.createElement('div');
        authorName.style.fontWeight = '600';
        authorName.style.fontSize = '14px';
        authorName.textContent = testimonial.author;
        authorInfo.appendChild(authorName);

        if (testimonial.role) {
            const authorRole = document.createElement('div');
            authorRole.style.fontSize = '13px';
            authorRole.style.color = 'var(--text-muted)';
            authorRole.textContent = testimonial.role;
            authorInfo.appendChild(authorRole);
        }

        authorContainer.appendChild(authorInfo);
        container.appendChild(authorContainer);

        return container;
    });

    return createSimpleCarousel(items, {
        loop: true,
        autoplay: true,
        autoplayDelay: 5000,
        ...options
    });
}

// Carousel API methods
function getCarouselState(carousel) {
    return carousel._state;
}

function scrollCarouselTo(carousel, index) {
    carousel._scrollTo(index);
}

function scrollCarouselPrev(carousel) {
    carousel._scrollPrev();
}

function scrollCarouselNext(carousel) {
    carousel._scrollNext();
}

function startCarouselAutoplay(carousel) {
    carousel._startAutoplay();
}

function stopCarouselAutoplay(carousel) {
    carousel._stopAutoplay();
}

// Chart Component Functions (Canvas-based charting)

// Default chart colors
const ChartColors = {
    primary: ['#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
    success: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
    warning: ['#ca8a04', '#eab308', '#facc15', '#fde047', '#fef08a'],
    danger: ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca'],
    mixed: ['#1d4ed8', '#16a34a', '#ca8a04', '#dc2626', '#8b5cf6', '#ec4899', '#06b6d4']
};

function createChartContainer(options = {}) {
    const {
        width = '100%',
        height = null,
        aspectRatio = '16/9',
        className = ''
    } = options;

    const wrapper = document.createElement('div');
    wrapper.className = `chart-wrapper ${className}`;

    const container = document.createElement('div');
    container.className = 'chart-container';
    container.style.width = width;
    
    if (height) {
        container.style.height = height;
        container.style.aspectRatio = 'auto';
    } else {
        container.style.aspectRatio = aspectRatio;
    }

    wrapper.appendChild(container);
    wrapper._container = container;

    return wrapper;
}

function createLineChart(data, options = {}) {
    const {
        xKey = 'name',
        yKeys = [],
        colors = ChartColors.primary,
        showGrid = true,
        showTooltip = true,
        showLegend = true,
        smooth = false,
        fill = false,
        strokeWidth = 2,
        ...containerOptions
    } = options;

    const wrapper = createChartContainer(containerOptions);
    const container = wrapper._container;

    const canvas = document.createElement('canvas');
    canvas.className = 'chart-canvas';
    container.appendChild(canvas);

    // Tooltip
    let tooltip = null;
    if (showTooltip) {
        tooltip = createChartTooltip();
        container.appendChild(tooltip);
    }

    // Legend
    if (showLegend && yKeys.length > 0) {
        const legend = createChartLegend(yKeys.map((key, index) => ({
            label: key,
            color: colors[index % colors.length]
        })));
        wrapper.appendChild(legend);
    }

    // Draw chart
    const ctx = canvas.getContext('2d');
    
    function drawChart() {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get min/max values
        let maxValue = 0;
        yKeys.forEach(key => {
            data.forEach(item => {
                maxValue = Math.max(maxValue, item[key] || 0);
            });
        });
        maxValue = Math.ceil(maxValue * 1.1);

        // Draw grid
        if (showGrid) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i <= 5; i++) {
                const y = padding.top + (chartHeight / 5) * i;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(padding.left + chartWidth, y);
                ctx.stroke();
            }
        }

        // Draw axes labels
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        
        for (let i = 0; i <= 5; i++) {
            const value = maxValue - (maxValue / 5) * i;
            const y = padding.top + (chartHeight / 5) * i;
            ctx.fillText(Math.round(value).toString(), padding.left - 10, y + 4);
        }

        // Draw X axis labels
        ctx.textAlign = 'center';
        data.forEach((item, index) => {
            const x = padding.left + (chartWidth / (data.length - 1)) * index;
            ctx.fillText(item[xKey], x, canvas.height - 15);
        });

        // Draw lines
        yKeys.forEach((key, keyIndex) => {
            const color = colors[keyIndex % colors.length];
            ctx.strokeStyle = color;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Draw line
            ctx.beginPath();
            data.forEach((item, index) => {
                const x = padding.left + (chartWidth / (data.length - 1)) * index;
                const value = item[key] || 0;
                const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    if (smooth) {
                        // Smooth curve
                        const prevItem = data[index - 1];
                        const prevX = padding.left + (chartWidth / (data.length - 1)) * (index - 1);
                        const prevY = padding.top + chartHeight - ((prevItem[key] || 0) / maxValue) * chartHeight;
                        const cpX = (prevX + x) / 2;
                        ctx.quadraticCurveTo(cpX, prevY, x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            });
            ctx.stroke();

            // Fill area
            if (fill) {
                ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
                ctx.lineTo(padding.left, padding.top + chartHeight);
                ctx.closePath();
                ctx.fillStyle = color.replace(')', ', 0.1)').replace('rgb', 'rgba');
                ctx.fill();
            }

            // Draw points
            data.forEach((item, index) => {
                const x = padding.left + (chartWidth / (data.length - 1)) * index;
                const value = item[key] || 0;
                const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();

                // White center
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        });

        // Tooltip interaction
        if (showTooltip) {
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                
                // Find closest data point
                let closestIndex = 0;
                let closestDistance = Infinity;
                
                data.forEach((item, index) => {
                    const x = padding.left + (chartWidth / (data.length - 1)) * index;
                    const distance = Math.abs(mouseX - x);
                    
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestIndex = index;
                    }
                });

                if (closestDistance < 30) {
                    const item = data[closestIndex];
                    const tooltipData = yKeys.map((key, index) => ({
                        name: key,
                        value: item[key],
                        color: colors[index % colors.length]
                    }));

                    showChartTooltip(tooltip, e, item[xKey], tooltipData);
                } else {
                    hideChartTooltip(tooltip);
                }
            });

            canvas.addEventListener('mouseleave', () => {
                hideChartTooltip(tooltip);
            });
        }
    }

    drawChart();
    window.addEventListener('resize', drawChart);

    wrapper._destroy = () => {
        window.removeEventListener('resize', drawChart);
    };

    return wrapper;
}

function createBarChart(data, options = {}) {
    const {
        xKey = 'name',
        yKeys = [],
        colors = ChartColors.primary,
        showGrid = true,
        showTooltip = true,
        showLegend = true,
        stacked = false,
        barPadding = 0.2,
        ...containerOptions
    } = options;

    const wrapper = createChartContainer(containerOptions);
    const container = wrapper._container;

    const canvas = document.createElement('canvas');
    canvas.className = 'chart-canvas';
    container.appendChild(canvas);

    // Tooltip
    let tooltip = null;
    if (showTooltip) {
        tooltip = createChartTooltip();
        container.appendChild(tooltip);
    }

    // Legend
    if (showLegend && yKeys.length > 0) {
        const legend = createChartLegend(yKeys.map((key, index) => ({
            label: key,
            color: colors[index % colors.length]
        })));
        wrapper.appendChild(legend);
    }

    const ctx = canvas.getContext('2d');
    
    function drawChart() {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get max value
        let maxValue = 0;
        data.forEach(item => {
            if (stacked) {
                const sum = yKeys.reduce((acc, key) => acc + (item[key] || 0), 0);
                maxValue = Math.max(maxValue, sum);
            } else {
                yKeys.forEach(key => {
                    maxValue = Math.max(maxValue, item[key] || 0);
                });
            }
        });
        maxValue = Math.ceil(maxValue * 1.1);

        // Draw grid
        if (showGrid) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i <= 5; i++) {
                const y = padding.top + (chartHeight / 5) * i;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(padding.left + chartWidth, y);
                ctx.stroke();
            }
        }

        // Y axis labels
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        
        for (let i = 0; i <= 5; i++) {
            const value = maxValue - (maxValue / 5) * i;
            const y = padding.top + (chartHeight / 5) * i;
            ctx.fillText(Math.round(value).toString(), padding.left - 10, y + 4);
        }

        // Draw bars
        const barGroupWidth = chartWidth / data.length;
        const barWidth = stacked 
            ? barGroupWidth * (1 - barPadding)
            : (barGroupWidth * (1 - barPadding)) / yKeys.length;

        data.forEach((item, dataIndex) => {
            const groupX = padding.left + barGroupWidth * dataIndex;
            
            if (stacked) {
                let stackY = padding.top + chartHeight;
                
                yKeys.forEach((key, keyIndex) => {
                    const value = item[key] || 0;
                    const barHeight = (value / maxValue) * chartHeight;
                    const barX = groupX + (barGroupWidth * barPadding) / 2;
                    
                    ctx.fillStyle = colors[keyIndex % colors.length];
                    ctx.fillRect(barX, stackY - barHeight, barWidth, barHeight);
                    
                    stackY -= barHeight;
                });
            } else {
                yKeys.forEach((key, keyIndex) => {
                    const value = item[key] || 0;
                    const barHeight = (value / maxValue) * chartHeight;
                    const barX = groupX + (barGroupWidth * barPadding) / 2 + barWidth * keyIndex;
                    const barY = padding.top + chartHeight - barHeight;
                    
                    ctx.fillStyle = colors[keyIndex % colors.length];
                    ctx.fillRect(barX, barY, barWidth, barHeight);
                });
            }

            // X axis label
            ctx.fillStyle = 'var(--text-muted)';
            ctx.textAlign = 'center';
            ctx.fillText(item[xKey], groupX + barGroupWidth / 2, canvas.height - 15);
        });

        // Tooltip
        if (showTooltip) {
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const barGroupWidth = chartWidth / data.length;
                const dataIndex = Math.floor((mouseX - padding.left) / barGroupWidth);

                if (dataIndex >= 0 && dataIndex < data.length) {
                    const item = data[dataIndex];
                    const tooltipData = yKeys.map((key, index) => ({
                        name: key,
                        value: item[key],
                        color: colors[index % colors.length]
                    }));

                    showChartTooltip(tooltip, e, item[xKey], tooltipData);
                } else {
                    hideChartTooltip(tooltip);
                }
            });

            canvas.addEventListener('mouseleave', () => {
                hideChartTooltip(tooltip);
            });
        }
    }

    drawChart();
    window.addEventListener('resize', drawChart);

    wrapper._destroy = () => {
        window.removeEventListener('resize', drawChart);
    };

    return wrapper;
}

function createPieChart(data, options = {}) {
    const {
        nameKey = 'name',
        valueKey = 'value',
        colors = ChartColors.mixed,
        showTooltip = true,
        showLegend = true,
        donut = false,
        donutWidth = 0.6,
        ...containerOptions
    } = options;

    const wrapper = createChartContainer({ ...containerOptions, aspectRatio: '1/1' });
    const container = wrapper._container;

    const canvas = document.createElement('canvas');
    canvas.className = 'chart-canvas';
    container.appendChild(canvas);

    // Tooltip
    let tooltip = null;
    if (showTooltip) {
        tooltip = createChartTooltip();
        container.appendChild(tooltip);
    }

    // Legend
    if (showLegend) {
        const legend = createChartLegend(data.map((item, index) => ({
            label: item[nameKey],
            color: colors[index % colors.length]
        })));
        wrapper.appendChild(legend);
    }

    const ctx = canvas.getContext('2d');
    
    function drawChart() {
        const rect = container.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        canvas.width = size;
        canvas.height = size;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // Calculate total
        const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);

        // Draw slices
        let currentAngle = -Math.PI / 2;

        data.forEach((item, index) => {
            const value = item[valueKey] || 0;
            const sliceAngle = (value / total) * Math.PI * 2;
            const color = colors[index % colors.length];

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            // Slice border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            currentAngle += sliceAngle;
        });

        // Donut hole
        if (donut) {
            ctx.fillStyle = getComputedStyle(container).getPropertyValue('--bg-primary') || '#fff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * donutWidth, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tooltip
        if (showTooltip) {
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const dx = mouseX - centerX;
                const dy = mouseY - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= radius && (!donut || distance >= radius * donutWidth)) {
                    let angle = Math.atan2(dy, dx) + Math.PI / 2;
                    if (angle < 0) angle += Math.PI * 2;

                    let currentAngle = 0;
                    for (let i = 0; i < data.length; i++) {
                        const value = data[i][valueKey] || 0;
                        const sliceAngle = (value / total) * Math.PI * 2;
                        
                        if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
                            const item = data[i];
                            const percentage = ((value / total) * 100).toFixed(1);
                            
                            showChartTooltip(tooltip, e, item[nameKey], [{
                                name: item[nameKey],
                                value: `${value} (${percentage}%)`,
                                color: colors[i % colors.length]
                            }]);
                            break;
                        }
                        
                        currentAngle += sliceAngle;
                    }
                } else {
                    hideChartTooltip(tooltip);
                }
            });

            canvas.addEventListener('mouseleave', () => {
                hideChartTooltip(tooltip);
            });
        }
    }

    drawChart();
    window.addEventListener('resize', drawChart);

    wrapper._destroy = () => {
        window.removeEventListener('resize', drawChart);
    };

    return wrapper;
}

function createAreaChart(data, options = {}) {
    return createLineChart(data, { ...options, fill: true, strokeWidth: 2 });
}

function createDonutChart(data, options = {}) {
    return createPieChart(data, { ...options, donut: true });
}

// Tooltip helpers
function createChartTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    return tooltip;
}

function showChartTooltip(tooltip, event, label, items) {
    if (!tooltip) return;

    tooltip.innerHTML = '';
    tooltip.className = 'chart-tooltip chart-tooltip-active';

    if (label) {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'chart-tooltip-label';
        labelDiv.textContent = label;
        tooltip.appendChild(labelDiv);
    }

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'chart-tooltip-item';

        const indicator = document.createElement('div');
        indicator.className = 'chart-tooltip-indicator chart-tooltip-indicator-dot';
        indicator.style.background = item.color;
        itemDiv.appendChild(indicator);

        const content = document.createElement('div');
        content.className = 'chart-tooltip-content';

        const name = document.createElement('span');
        name.className = 'chart-tooltip-name';
        name.textContent = item.name;
        content.appendChild(name);

        const value = document.createElement('span');
        value.className = 'chart-tooltip-value';
        value.textContent = typeof item.value === 'number' ? item.value.toLocaleString() : item.value;
        content.appendChild(value);

        itemDiv.appendChild(content);
        tooltip.appendChild(itemDiv);
    });

    // Position tooltip
    const container = tooltip.parentElement;
    const rect = container.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - rect.left + 10}px`;
    tooltip.style.top = `${event.clientY - rect.top - 10}px`;
}

function hideChartTooltip(tooltip) {
    if (tooltip) {
        tooltip.className = 'chart-tooltip';
    }
}

// Legend helpers
function createChartLegend(items, position = 'bottom') {
    const legend = document.createElement('div');
    legend.className = `chart-legend chart-legend-${position}`;

    items.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'chart-legend-item';

        const indicator = document.createElement('div');
        indicator.className = 'chart-legend-indicator';
        indicator.style.background = item.color;
        legendItem.appendChild(indicator);

        const label = document.createElement('span');
        label.className = 'chart-legend-label';
        label.textContent = item.label;
        legendItem.appendChild(label);

        legend.appendChild(legendItem);
    });

    return legend;
}

// Checkbox Component Functions
function createCheckbox(options = {}) {
    const {
        checked = false,
        disabled = false,
        onChange = null,
        id = null,
        name = null,
        value = null,
        className = '',
        ...attrs
    } = options;

    const checkbox = document.createElement('button');
    checkbox.type = 'button';
    checkbox.role = 'checkbox';
    checkbox.className = `checkbox ${checked ? 'checkbox-checked' : ''} ${className}`;
    checkbox.setAttribute('aria-checked', checked.toString());
    checkbox.tabIndex = disabled ? -1 : 0;
    
    if (disabled) {
        checkbox.disabled = true;
    }

    if (id) {
        checkbox.id = id;
    }

    if (name) {
        checkbox.dataset.name = name;
    }

    if (value !== null) {
        checkbox.dataset.value = value;
    }

    // Indicator with check icon
    const indicator = document.createElement('span');
    indicator.className = 'checkbox-indicator';
    indicator.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    checkbox.appendChild(indicator);

    // Store state
    checkbox._checked = checked;

    // Click handler
    checkbox.addEventListener('click', (e) => {
        e.preventDefault();
        if (disabled) return;
        
        checkbox._checked = !checkbox._checked;
        
        if (checkbox._checked) {
            checkbox.classList.add('checkbox-checked');
        } else {
            checkbox.classList.remove('checkbox-checked');
        }
        
        checkbox.setAttribute('aria-checked', checkbox._checked.toString());
        
        if (onChange) {
            onChange(checkbox._checked, e);
        }
    });

    // Keyboard support (Space/Enter)
    checkbox.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            checkbox.click();
        }
    });

    // Add any additional attributes
    Object.keys(attrs).forEach(key => {
        if (key.startsWith('data-') || key.startsWith('aria-')) {
            checkbox.setAttribute(key, attrs[key]);
        }
    });

    return checkbox;
}

function createCheckboxWithLabel(options = {}) {
    const {
        label,
        description = null,
        checked = false,
        disabled = false,
        onChange = null,
        id = null,
        labelClassName = '',
        ...checkboxOptions
    } = options;

    const wrapper = document.createElement('label');
    wrapper.className = 'checkbox-wrapper';

    const checkbox = createCheckbox({
        checked,
        disabled,
        onChange,
        id,
        ...checkboxOptions
    });

    wrapper.appendChild(checkbox);

    if (label) {
        const textContainer = document.createElement('div');
        
        const labelSpan = document.createElement('span');
        labelSpan.className = `checkbox-label ${labelClassName}`;
        
        if (typeof label === 'string') {
            labelSpan.textContent = label;
        } else {
            labelSpan.appendChild(label);
        }
        
        textContainer.appendChild(labelSpan);

        if (description) {
            const descSpan = document.createElement('div');
            descSpan.className = 'checkbox-description';
            
            if (typeof description === 'string') {
                descSpan.textContent = description;
            } else {
                descSpan.appendChild(description);
            }
            
            textContainer.appendChild(descSpan);
        }

        wrapper.appendChild(textContainer);
    }

    // Make wrapper clickable
    if (!disabled) {
        wrapper.style.cursor = 'pointer';
        wrapper.addEventListener('click', (e) => {
            // Only trigger if clicked on label, not checkbox itself
            if (e.target !== checkbox && !checkbox.contains(e.target)) {
                checkbox.click();
            }
        });
    }

    return wrapper;
}

// Checkbox Helper Functions
function setCheckboxChecked(checkbox, checked) {
    if (checkbox._checked === checked) return;
    
    checkbox._checked = checked;
    
    if (checked) {
        checkbox.classList.add('checkbox-checked');
    } else {
        checkbox.classList.remove('checkbox-checked');
    }
    
    checkbox.setAttribute('aria-checked', checked.toString());
}

function getCheckboxChecked(checkbox) {
    return checkbox._checked;
}

function setCheckboxDisabled(checkbox, disabled) {
    checkbox.disabled = disabled;
    checkbox.tabIndex = disabled ? -1 : 0;
}

function toggleCheckbox(checkbox) {
    if (!checkbox.disabled) {
        checkbox.click();
    }
}

// Checkbox Group Functions
function createCheckboxGroup(options = {}) {
    const {
        items = [],
        value = [],
        onChange = null,
        orientation = 'vertical', // 'vertical' or 'horizontal'
        className = ''
    } = options;

    const group = document.createElement('div');
    group.className = `checkbox-group ${className}`;
    group.style.display = 'flex';
    group.style.flexDirection = orientation === 'vertical' ? 'column' : 'row';
    group.style.gap = orientation === 'vertical' ? '12px' : '16px';
    
    if (orientation === 'horizontal') {
        group.style.flexWrap = 'wrap';
    }

    const checkboxes = [];
    
    items.forEach(item => {
        const itemValue = item.value || item.label;
        const checked = value.includes(itemValue);
        
        const checkbox = createCheckboxWithLabel({
            label: item.label,
            description: item.description,
            value: itemValue,
            checked: checked,
            disabled: item.disabled,
            onChange: (isChecked) => {
                // Update group value
                const currentValues = checkboxes
                    .filter(cb => cb._checked)
                    .map(cb => cb.dataset.value);
                
                if (onChange) {
                    onChange(currentValues);
                }
            }
        });
        
        const checkboxInput = checkbox.querySelector('.checkbox');
        checkboxes.push(checkboxInput);
        group.appendChild(checkbox);
    });

    group._checkboxes = checkboxes;
    
    group._getValue = function() {
        return checkboxes
            .filter(cb => cb._checked)
            .map(cb => cb.dataset.value);
    };
    
    group._setValue = function(newValue) {
        checkboxes.forEach(cb => {
            const shouldBeChecked = newValue.includes(cb.dataset.value);
            setCheckboxChecked(cb, shouldBeChecked);
        });
    };

    return group;
}

function createFormCheckbox(options = {}) {
    const {
        label,
        name,
        value = 'on',
        checked = false,
        required = false,
        ...otherOptions
    } = options;

    const wrapper = createCheckboxWithLabel({
        label,
        checked,
        id: name,
        name,
        value,
        ...otherOptions
    });

    // Add hidden input for form submission
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = name;
    hiddenInput.value = checked ? value : '';

    const checkbox = wrapper.querySelector('.checkbox');
    checkbox.addEventListener('click', () => {
        hiddenInput.value = checkbox._checked ? value : '';
    });

    wrapper.appendChild(hiddenInput);

    if (required) {
        wrapper.dataset.required = 'true';
    }

    return wrapper;
}

// Checkbox state helpers
function checkAll(checkboxes) {
    checkboxes.forEach(checkbox => {
        setCheckboxChecked(checkbox, true);
    });
}

function uncheckAll(checkboxes) {
    checkboxes.forEach(checkbox => {
        setCheckboxChecked(checkbox, false);
    });
}

function toggleAll(checkboxes) {
    const allChecked = checkboxes.every(cb => cb._checked);
    checkboxes.forEach(checkbox => {
        setCheckboxChecked(checkbox, !allChecked);
    });
}

function getCheckedValues(checkboxes) {
    return checkboxes
        .filter(cb => cb._checked)
        .map(cb => cb.dataset.value || cb.dataset.name);
}

// Indeterminate checkbox (for "select all" with partial selection)
function createIndeterminateCheckbox(options = {}) {
    const {
        label,
        checked = false,
        indeterminate = false,
        onChange = null,
        ...otherOptions
    } = options;

    const checkbox = createCheckbox({
        checked,
        onChange,
        ...otherOptions
    });

    // Add indeterminate state
    checkbox._indeterminate = indeterminate;
    
    checkbox._updateIndeterminate = function() {
        const indicator = checkbox.querySelector('.checkbox-indicator');
        
        if (checkbox._indeterminate) {
            checkbox.classList.add('checkbox-checked');
            indicator.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
        } else if (checkbox._checked) {
            checkbox.classList.add('checkbox-checked');
            indicator.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        } else {
            checkbox.classList.remove('checkbox-checked');
        }
    };

    checkbox._updateIndeterminate();

    // Override click handler
    const originalClick = checkbox.onclick;
    checkbox.onclick = null;
    
    checkbox.addEventListener('click', (e) => {
        e.preventDefault();
        if (checkbox.disabled) return;
        
        if (checkbox._indeterminate) {
            checkbox._indeterminate = false;
            checkbox._checked = true;
        } else {
            checkbox._checked = !checkbox._checked;
        }
        
        checkbox._updateIndeterminate();
        checkbox.setAttribute('aria-checked', checkbox._checked ? 'true' : checkbox._indeterminate ? 'mixed' : 'false');
        
        if (onChange) {
            onChange(checkbox._checked, checkbox._indeterminate, e);
        }
    });

    if (label) {
        const wrapper = document.createElement('label');
        wrapper.className = 'checkbox-wrapper';
        wrapper.appendChild(checkbox);
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'checkbox-label';
        labelSpan.textContent = label;
        wrapper.appendChild(labelSpan);
        
        wrapper.addEventListener('click', (e) => {
            if (e.target !== checkbox && !checkbox.contains(e.target)) {
                checkbox.click();
            }
        });
        
        return wrapper;
    }

    return checkbox;
}

function setCheckboxIndeterminate(checkbox, indeterminate) {
    if (checkbox._updateIndeterminate) {
        checkbox._indeterminate = indeterminate;
        checkbox._updateIndeterminate();
        checkbox.setAttribute('aria-checked', checkbox._checked ? 'true' : indeterminate ? 'mixed' : 'false');
    }
}

// Collapsible Component Functions
function createCollapsible(options = {}) {
    const {
        open = false,
        onOpenChange = null,
        disabled = false,
        className = ''
    } = options;

    const collapsible = document.createElement('div');
    collapsible.className = `collapsible ${className}`;
    collapsible._open = open;
    collapsible._disabled = disabled;

    // Methods to be used by trigger and content
    collapsible._toggle = function() {
        if (collapsible._disabled) return;
        
        collapsible._open = !collapsible._open;
        collapsible._updateState();
        
        if (onOpenChange) {
            onOpenChange(collapsible._open);
        }
    };

    collapsible._setOpen = function(isOpen) {
        if (collapsible._disabled) return;
        
        collapsible._open = isOpen;
        collapsible._updateState();
        
        if (onOpenChange) {
            onOpenChange(collapsible._open);
        }
    };

    collapsible._updateState = function() {
        if (collapsible._trigger) {
            collapsible._trigger.setAttribute('aria-expanded', collapsible._open.toString());
        }
        
        if (collapsible._content) {
            if (collapsible._open) {
                collapsible._content.dataset.state = 'open';
                collapsible._content.style.height = 'auto';
                const height = collapsible._content.scrollHeight;
                collapsible._content.style.height = '0';
                requestAnimationFrame(() => {
                    collapsible._content.style.height = `${height}px`;
                });
                
                // Remove height after animation
                setTimeout(() => {
                    if (collapsible._open) {
                        collapsible._content.style.height = 'auto';
                    }
                }, 200);
            } else {
                const height = collapsible._content.scrollHeight;
                collapsible._content.style.height = `${height}px`;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        collapsible._content.style.height = '0';
                    });
                });
                setTimeout(() => {
                    collapsible._content.dataset.state = 'closed';
                }, 200);
            }
        }
    };

    return collapsible;
}

function createCollapsibleTrigger(text, options = {}) {
    const {
        icon = 'chevron',
        className = ''
    } = options;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = `collapsible-trigger ${className}`;
    trigger.setAttribute('aria-expanded', 'false');
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    trigger.appendChild(textSpan);

    // Icon
    const iconSpan = document.createElement('span');
    
    if (icon === 'chevron') {
        iconSpan.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="6 9 12 15 18 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    } else if (icon === 'plus') {
        iconSpan.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19" stroke-width="2" stroke-linecap="round"/>
                <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    } else if (typeof icon === 'string') {
        iconSpan.innerHTML = icon;
    }
    
    trigger.appendChild(iconSpan);

    trigger.addEventListener('click', () => {
        const collapsible = trigger.closest('.collapsible');
        if (collapsible && collapsible._toggle) {
            collapsible._toggle();
        }
    });

    return trigger;
}

function createCollapsibleContent(content, options = {}) {
    const { className = '' } = options;

    const contentWrapper = document.createElement('div');
    contentWrapper.className = `collapsible-content ${className}`;
    contentWrapper.dataset.state = 'closed';
    contentWrapper.style.height = '0';

    const inner = document.createElement('div');
    inner.className = 'collapsible-content-inner';
    
    if (typeof content === 'string') {
        inner.innerHTML = content;
    } else if (content instanceof Element) {
        inner.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(item => {
            if (typeof item === 'string') {
                inner.innerHTML += item;
            } else {
                inner.appendChild(item);
            }
        });
    }

    contentWrapper.appendChild(inner);

    return contentWrapper;
}

// Collapsible Helper Functions
function createSimpleCollapsible(options = {}) {
    const {
        title,
        content,
        open = false,
        icon = 'chevron',
        onOpenChange = null,
        className = ''
    } = options;

    const collapsible = createCollapsible({ open, onOpenChange, className });

    const trigger = createCollapsibleTrigger(title, { icon });
    collapsible.appendChild(trigger);
    collapsible._trigger = trigger;

    const contentElement = createCollapsibleContent(content);
    collapsible.appendChild(contentElement);
    collapsible._content = contentElement;

    // Initialize state
    if (open) {
        trigger.setAttribute('aria-expanded', 'true');
        contentElement.dataset.state = 'open';
        contentElement.style.height = 'auto';
    }

    return collapsible;
}

function createCollapsibleCard(options = {}) {
    const {
        title,
        content,
        open = false,
        className = ''
    } = options;

    const card = createCard({ className: `${className}` });
    
    const collapsible = createSimpleCollapsible({
        title,
        content,
        open
    });

    // Adjust padding
    const trigger = collapsible.querySelector('.collapsible-trigger');
    trigger.style.padding = '16px 20px';
    
    const contentWrapper = collapsible.querySelector('.collapsible-content-inner');
    contentWrapper.style.padding = '0 20px 20px 20px';

    card.appendChild(collapsible);

    return card;
}

function createFAQCollapsible(faqs, options = {}) {
    const { className = '' } = options;

    const container = document.createElement('div');
    container.className = `faq-container ${className}`;
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';

    faqs.forEach((faq, index) => {
        const collapsible = createSimpleCollapsible({
            title: faq.question,
            content: faq.answer,
            open: index === 0 // First one open by default
        });

        // Add border
        collapsible.style.border = '1px solid var(--border-color)';
        collapsible.style.borderRadius = '8px';
        collapsible.style.overflow = 'hidden';

        container.appendChild(collapsible);
    });

    return container;
}

function createCollapsibleSection(options = {}) {
    const {
        title,
        description = null,
        content,
        open = false,
        badge = null,
        className = ''
    } = options;

    const collapsible = createCollapsible({ open, className });

    // Custom trigger with description
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'collapsible-trigger';
    trigger.setAttribute('aria-expanded', open.toString());
    trigger.style.flexDirection = 'column';
    trigger.style.alignItems = 'flex-start';
    trigger.style.gap = '4px';

    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'center';
    titleRow.style.justifyContent = 'space-between';
    titleRow.style.width = '100%';

    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '8px';

    const titleText = document.createElement('span');
    titleText.textContent = title;
    titleContainer.appendChild(titleText);

    if (badge) {
        titleContainer.appendChild(badge);
    }

    titleRow.appendChild(titleContainer);

    const icon = document.createElement('span');
    icon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="6 9 12 15 18 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    titleRow.appendChild(icon);

    trigger.appendChild(titleRow);

    if (description) {
        const descText = document.createElement('div');
        descText.style.fontSize = '13px';
        descText.style.color = 'var(--text-muted)';
        descText.style.fontWeight = '400';
        descText.textContent = description;
        trigger.appendChild(descText);
    }

    trigger.addEventListener('click', () => {
        collapsible._toggle();
    });

    collapsible.appendChild(trigger);
    collapsible._trigger = trigger;

    const contentElement = createCollapsibleContent(content);
    collapsible.appendChild(contentElement);
    collapsible._content = contentElement;

    // Initialize state
    if (open) {
        contentElement.dataset.state = 'open';
        contentElement.style.height = 'auto';
    }

    return collapsible;
}

function createCollapsibleList(items, options = {}) {
    const {
        allowMultiple = true,
        defaultOpen = [],
        className = ''
    } = options;

    const container = document.createElement('div');
    container.className = `collapsible-list ${className}`;
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '4px';

    const collapsibles = [];

    items.forEach((item, index) => {
        const isOpen = defaultOpen.includes(index);
        
        const collapsible = createSimpleCollapsible({
            title: item.title,
            content: item.content,
            open: isOpen,
            onOpenChange: (open) => {
                if (!allowMultiple && open) {
                    // Close other collapsibles
                    collapsibles.forEach((other, otherIndex) => {
                        if (otherIndex !== index && other._open) {
                            other._setOpen(false);
                        }
                    });
                }
            }
        });

        // Add border
        collapsible.style.border = '1px solid var(--border-color)';
        collapsible.style.borderRadius = '8px';

        collapsibles.push(collapsible);
        container.appendChild(collapsible);
    });

    return container;
}

// Collapsible State Management
function openCollapsible(collapsible) {
    if (collapsible._setOpen) {
        collapsible._setOpen(true);
    }
}

function closeCollapsible(collapsible) {
    if (collapsible._setOpen) {
        collapsible._setOpen(false);
    }
}

function toggleCollapsible(collapsible) {
    if (collapsible._toggle) {
        collapsible._toggle();
    }
}

function isCollapsibleOpen(collapsible) {
    return collapsible._open || false;
}

function setCollapsibleDisabled(collapsible, disabled) {
    collapsible._disabled = disabled;
    const trigger = collapsible.querySelector('.collapsible-trigger');
    if (trigger) {
        trigger.disabled = disabled;
        trigger.style.opacity = disabled ? '0.5' : '1';
        trigger.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
}

// Command Component (Command Palette)
// A searchable command palette with keyboard navigation

/**
 * Create the base command container
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onValueChange] - Callback when value changes
 * @returns {HTMLElement} Command container
 */
function createCommand(options = {}) {
  const command = document.createElement('div');
  command.className = `command ${options.className || ''}`;
  command._selectedIndex = -1;
  command._items = [];
  command._value = '';
  command._onValueChange = options.onValueChange;

  return command;
}

/**
 * Create command input with search icon
 * @param {Object} options - Configuration options
 * @param {string} [options.placeholder='Type a command or search...'] - Input placeholder
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onValueChange] - Callback when input value changes
 * @returns {HTMLElement} Command input wrapper
 */
function createCommandInput(options = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `command-input-wrapper ${options.className || ''}`;

  // Search icon
  const icon = document.createElement('svg');
  icon.className = 'command-input-icon';
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.innerHTML = '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>';

  // Input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'command-input';
  input.placeholder = options.placeholder || 'Type a command or search...';
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('spellcheck', 'false');

  if (options.onValueChange) {
    input.addEventListener('input', (e) => {
      options.onValueChange(e.target.value);
    });
  }

  wrapper.appendChild(icon);
  wrapper.appendChild(input);
  wrapper._input = input;

  return wrapper;
}

/**
 * Create scrollable list container for command items
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Command list
 */
function createCommandList(options = {}) {
  const list = document.createElement('div');
  list.className = `command-list ${options.className || ''}`;
  list.setAttribute('role', 'listbox');
  return list;
}

/**
 * Create empty state message
 * @param {Object} options - Configuration options
 * @param {string} [options.message='No results found.'] - Empty message
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Empty state element
 */
function createCommandEmpty(options = {}) {
  const empty = document.createElement('div');
  empty.className = `command-empty ${options.className || ''}`;
  empty.textContent = options.message || 'No results found.';
  empty.style.display = 'none';
  empty._isCommandEmpty = true;
  return empty;
}

/**
 * Create a group of command items with heading
 * @param {Object} options - Configuration options
 * @param {string} [options.heading] - Group heading text
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Command group
 */
function createCommandGroup(options = {}) {
  const group = document.createElement('div');
  group.className = `command-group ${options.className || ''}`;
  group.setAttribute('role', 'group');

  if (options.heading) {
    const heading = document.createElement('div');
    heading.className = 'command-group-heading';
    heading.textContent = options.heading;
    group.appendChild(heading);
  }

  return group;
}

/**
 * Create a command item (selectable option)
 * @param {Object} options - Configuration options
 * @param {string} [options.value] - Item value
 * @param {string} [options.label] - Display text
 * @param {string} [options.icon] - SVG path for icon
 * @param {string} [options.shortcut] - Keyboard shortcut text
 * @param {boolean} [options.disabled=false] - Disable the item
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onSelect] - Callback when item is selected
 * @returns {HTMLElement} Command item
 */
function createCommandItem(options = {}) {
  const item = document.createElement('div');
  item.className = `command-item ${options.className || ''}`;
  item.setAttribute('role', 'option');
  item.setAttribute('data-value', options.value || options.label || '');
  
  if (options.disabled) {
    item.setAttribute('data-disabled', 'true');
  }

  // Icon
  if (options.icon) {
    const icon = document.createElement('svg');
    icon.className = 'command-item-icon';
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.innerHTML = options.icon;
    item.appendChild(icon);
  }

  // Label
  const label = document.createElement('span');
  label.textContent = options.label || options.value || '';
  item.appendChild(label);

  // Shortcut
  if (options.shortcut) {
    const shortcut = document.createElement('span');
    shortcut.className = 'command-shortcut';
    shortcut.textContent = options.shortcut;
    item.appendChild(shortcut);
  }

  // Store data
  item._commandValue = options.value || options.label || '';
  item._onSelect = options.onSelect;

  // Click handler
  if (!options.disabled && options.onSelect) {
    item.addEventListener('click', () => {
      options.onSelect(item._commandValue);
    });
  }

  return item;
}

/**
 * Create a visual separator
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Separator element
 */
function createCommandSeparator(options = {}) {
  const separator = document.createElement('div');
  separator.className = `command-separator ${options.className || ''}`;
  separator.setAttribute('role', 'separator');
  return separator;
}

/**
 * Create keyboard shortcut display
 * @param {Object} options - Configuration options
 * @param {string} options.text - Shortcut text (e.g., '⌘K', 'Ctrl+K')
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Shortcut element
 */
function createCommandShortcut(options = {}) {
  const shortcut = document.createElement('span');
  shortcut.className = `command-shortcut ${options.className || ''}`;
  shortcut.textContent = options.text || '';
  return shortcut;
}

/**
 * Create command dialog (modal command palette)
 * @param {Object} options - Configuration options
 * @param {HTMLElement} [options.content] - Command content
 * @param {boolean} [options.open=false] - Initially open
 * @param {Function} [options.onOpenChange] - Callback when open state changes
 * @param {string} [options.className] - Additional CSS classes
 * @returns {Object} Dialog controls
 */
function createCommandDialog(options = {}) {
  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'command-dialog-overlay';
  overlay.style.display = 'none';

  // Dialog
  const dialog = document.createElement('div');
  dialog.className = `command-dialog ${options.className || ''}`;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.style.display = 'none';

  // Add content if provided
  if (options.content) {
    dialog.appendChild(options.content);
  }

  // Close on overlay click
  overlay.addEventListener('click', () => {
    controls.close();
  });

  // Close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && dialog.style.display !== 'none') {
      e.preventDefault();
      controls.close();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Append to body
  document.body.appendChild(overlay);
  document.body.appendChild(dialog);

  const controls = {
    overlay,
    dialog,
    open: () => {
      overlay.style.display = 'block';
      dialog.style.display = 'block';
      
      // Focus input if present
      const input = dialog.querySelector('.command-input');
      if (input) {
        setTimeout(() => input.focus(), 50);
      }
      
      if (options.onOpenChange) {
        options.onOpenChange(true);
      }
    },
    close: () => {
      overlay.style.display = 'none';
      dialog.style.display = 'none';
      if (options.onOpenChange) {
        options.onOpenChange(false);
      }
    },
    toggle: () => {
      if (dialog.style.display === 'none') {
        controls.open();
      } else {
        controls.close();
      }
    },
    destroy: () => {
      document.removeEventListener('keydown', handleKeyDown);
      overlay.remove();
      dialog.remove();
    }
  };

  if (options.open) {
    controls.open();
  }

  return controls;
}

/**
 * Add fuzzy search functionality to command palette
 * @param {HTMLElement} command - Command container
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} list - List container
 */
function enableCommandSearch(command, input, list) {
  const items = [];
  const groups = [];
  let emptyElement = null;

  // Collect all items and groups
  const collectItems = () => {
    items.length = 0;
    groups.length = 0;
    emptyElement = list.querySelector('.command-empty');

    list.querySelectorAll('.command-item').forEach(item => {
      if (!item._commandValue) {
        item._commandValue = item.getAttribute('data-value') || item.textContent.trim();
      }
      items.push(item);
    });

    list.querySelectorAll('.command-group').forEach(group => {
      groups.push(group);
    });
  };

  // Simple fuzzy search
  const fuzzyMatch = (text, search) => {
    text = text.toLowerCase();
    search = search.toLowerCase();
    
    let searchIndex = 0;
    for (let i = 0; i < text.length && searchIndex < search.length; i++) {
      if (text[i] === search[searchIndex]) {
        searchIndex++;
      }
    }
    return searchIndex === search.length;
  };

  // Filter items
  const filterItems = () => {
    const searchValue = input.value.toLowerCase().trim();
    collectItems();

    if (!searchValue) {
      // Show all
      items.forEach(item => {
        item.removeAttribute('data-hidden');
      });
      groups.forEach(group => {
        group.removeAttribute('data-hidden');
      });
      if (emptyElement) {
        emptyElement.style.display = 'none';
      }
      return;
    }

    let visibleCount = 0;

    // Filter items
    items.forEach(item => {
      const value = item._commandValue || '';
      if (fuzzyMatch(value, searchValue)) {
        item.removeAttribute('data-hidden');
        visibleCount++;
      } else {
        item.setAttribute('data-hidden', 'true');
      }
    });

    // Hide empty groups
    groups.forEach(group => {
      const visibleItems = group.querySelectorAll('.command-item:not([data-hidden])');
      if (visibleItems.length === 0) {
        group.setAttribute('data-hidden', 'true');
      } else {
        group.removeAttribute('data-hidden');
      }
    });

    // Show/hide empty state
    if (emptyElement) {
      emptyElement.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  };

  input.addEventListener('input', filterItems);
  
  // Initial collection
  collectItems();
}

/**
 * Add keyboard navigation to command palette
 * @param {HTMLElement} command - Command container
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} list - List container
 * @param {Function} onSelect - Callback when item is selected
 */
function enableCommandKeyboard(command, input, list, onSelect) {
  let selectedIndex = -1;

  const getVisibleItems = () => {
    return Array.from(list.querySelectorAll('.command-item:not([data-hidden]):not([data-disabled])'));
  };

  const updateSelection = (index) => {
    const items = getVisibleItems();
    
    // Clear previous selection
    items.forEach(item => {
      item.removeAttribute('data-selected');
    });

    if (index >= 0 && index < items.length) {
      selectedIndex = index;
      const selectedItem = items[selectedIndex];
      selectedItem.setAttribute('data-selected', 'true');
      
      // Scroll into view
      selectedItem.scrollIntoView({ block: 'nearest' });
    } else {
      selectedIndex = -1;
    }
  };

  const handleKeyDown = (e) => {
    const items = getVisibleItems();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = selectedIndex + 1;
      updateSelection(newIndex >= items.length ? 0 : newIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = selectedIndex - 1;
      updateSelection(newIndex < 0 ? items.length - 1 : newIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        const selectedItem = items[selectedIndex];
        if (selectedItem._onSelect) {
          selectedItem._onSelect(selectedItem._commandValue);
        }
        if (onSelect) {
          onSelect(selectedItem._commandValue);
        }
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      updateSelection(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      updateSelection(items.length - 1);
    }
  };

  input.addEventListener('keydown', handleKeyDown);
  
  // Reset selection when items change
  input.addEventListener('input', () => {
    updateSelection(-1);
  });
}

/**
 * Create a complete command palette with search and keyboard navigation
 * @param {Object} options - Configuration options
 * @param {Array} [options.items=[]] - Array of command items
 * @param {string} [options.placeholder='Type a command or search...'] - Input placeholder
 * @param {string} [options.emptyMessage='No results found.'] - Empty state message
 * @param {Function} [options.onSelect] - Callback when item is selected
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Complete command palette
 */
function createSimpleCommand(options = {}) {
  const command = createCommand({ className: options.className });
  
  const input = createCommandInput({ 
    placeholder: options.placeholder,
    onValueChange: options.onValueChange
  });
  
  const list = createCommandList();
  const empty = createCommandEmpty({ message: options.emptyMessage });
  
  list.appendChild(empty);
  
  // Add items
  if (options.items && options.items.length > 0) {
    options.items.forEach(itemConfig => {
      const item = createCommandItem({
        ...itemConfig,
        onSelect: (value) => {
          if (itemConfig.onSelect) {
            itemConfig.onSelect(value);
          }
          if (options.onSelect) {
            options.onSelect(value);
          }
        }
      });
      list.appendChild(item);
    });
  }
  
  command.appendChild(input);
  command.appendChild(list);
  
  // Enable search and keyboard navigation
  enableCommandSearch(command, input._input, list);
  enableCommandKeyboard(command, input._input, list, options.onSelect);
  
  return command;
}

/**
 * Create a grouped command palette
 * @param {Object} options - Configuration options
 * @param {Array} options.groups - Array of group objects with heading and items
 * @param {string} [options.placeholder] - Input placeholder
 * @param {Function} [options.onSelect] - Callback when item is selected
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Grouped command palette
 */
function createGroupedCommand(options = {}) {
  const command = createCommand({ className: options.className });
  
  const input = createCommandInput({ 
    placeholder: options.placeholder 
  });
  
  const list = createCommandList();
  const empty = createCommandEmpty();
  
  list.appendChild(empty);
  
  // Add groups
  if (options.groups && options.groups.length > 0) {
    options.groups.forEach((groupConfig, groupIndex) => {
      const group = createCommandGroup({ heading: groupConfig.heading });
      
      if (groupConfig.items && groupConfig.items.length > 0) {
        groupConfig.items.forEach(itemConfig => {
          const item = createCommandItem({
            ...itemConfig,
            onSelect: (value) => {
              if (itemConfig.onSelect) {
                itemConfig.onSelect(value);
              }
              if (options.onSelect) {
                options.onSelect(value);
              }
            }
          });
          group.appendChild(item);
        });
      }
      
      // Add separator between groups (except last)
      if (groupIndex < options.groups.length - 1) {
        list.appendChild(group);
        list.appendChild(createCommandSeparator());
      } else {
        list.appendChild(group);
      }
    });
  }
  
  command.appendChild(input);
  command.appendChild(list);
  
  // Enable search and keyboard navigation
  enableCommandSearch(command, input._input, list);
  enableCommandKeyboard(command, input._input, list, options.onSelect);
  
  return command;
}

/**
 * Create command dialog with search palette
 * @param {Object} options - Configuration options
 * @param {Array} [options.items] - Command items
 * @param {Array} [options.groups] - Grouped command items
 * @param {string} [options.placeholder] - Input placeholder
 * @param {Function} [options.onSelect] - Callback when item is selected (auto-closes dialog)
 * @param {string} [options.className] - Additional CSS classes
 * @returns {Object} Dialog controls with command palette
 */
function createSimpleCommandDialog(options = {}) {
  // Create command content
  const command = options.groups 
    ? createGroupedCommand({
        groups: options.groups,
        placeholder: options.placeholder,
        onSelect: (value) => {
          if (options.onSelect) {
            options.onSelect(value);
          }
          dialog.close();
        }
      })
    : createSimpleCommand({
        items: options.items,
        placeholder: options.placeholder,
        onSelect: (value) => {
          if (options.onSelect) {
            options.onSelect(value);
          }
          dialog.close();
        }
      });
  
  const dialog = createCommandDialog({
    content: command,
    className: options.className,
    onOpenChange: options.onOpenChange
  });
  
  return dialog;
}

// Common command icons
const CommandIcons = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
  folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="16" y1="18" x2="16" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="8" y1="18" x2="8" y2="18.01"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'
};

// Context Menu Component
// Right-click context menus with submenus, checkboxes, and radio items

/**
 * Create context menu item
 * @param {Object} options - Configuration options
 * @param {string} [options.label] - Item text
 * @param {string} [options.icon] - SVG path for icon
 * @param {string} [options.shortcut] - Keyboard shortcut display
 * @param {boolean} [options.disabled=false] - Disable the item
 * @param {boolean} [options.inset=false] - Add left padding
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onSelect] - Callback when item is selected
 * @returns {HTMLElement} Context menu item
 */
function createContextMenuItem(options = {}) {
  const item = document.createElement('div');
  item.className = `context-menu-item ${options.inset ? 'inset' : ''} ${options.className || ''}`;
  item.setAttribute('role', 'menuitem');
  item.setAttribute('tabindex', '-1');
  
  if (options.disabled) {
    item.setAttribute('data-disabled', 'true');
  }

  // Icon
  if (options.icon) {
    const icon = document.createElement('svg');
    icon.style.width = '16px';
    icon.style.height = '16px';
    icon.style.marginRight = '8px';
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.innerHTML = options.icon;
    item.appendChild(icon);
  }

  // Label
  const label = document.createElement('span');
  label.textContent = options.label || '';
  item.appendChild(label);

  // Shortcut
  if (options.shortcut) {
    const shortcut = document.createElement('span');
    shortcut.className = 'context-menu-shortcut';
    shortcut.textContent = options.shortcut;
    item.appendChild(shortcut);
  }

  // Click handler
  if (!options.disabled && options.onSelect) {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      options.onSelect();
    });
  }

  return item;
}

/**
 * Create checkbox menu item
 * @param {Object} options - Configuration options
 * @param {string} [options.label] - Item text
 * @param {boolean} [options.checked=false] - Checked state
 * @param {boolean} [options.disabled=false] - Disable the item
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onCheckedChange] - Callback when checked state changes
 * @returns {HTMLElement} Checkbox menu item
 */
function createContextMenuCheckboxItem(options = {}) {
  const item = document.createElement('div');
  item.className = `context-menu-checkbox-item ${options.className || ''}`;
  item.setAttribute('role', 'menuitemcheckbox');
  item.setAttribute('tabindex', '-1');
  item.setAttribute('aria-checked', options.checked ? 'true' : 'false');
  
  if (options.disabled) {
    item.setAttribute('data-disabled', 'true');
  }

  // Indicator
  const indicator = document.createElement('span');
  indicator.className = 'context-menu-item-indicator';
  
  if (options.checked) {
    const checkIcon = document.createElement('svg');
    checkIcon.setAttribute('viewBox', '0 0 24 24');
    checkIcon.setAttribute('fill', 'none');
    checkIcon.setAttribute('stroke', 'currentColor');
    checkIcon.setAttribute('stroke-width', '2');
    checkIcon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
    indicator.appendChild(checkIcon);
  }
  
  item.appendChild(indicator);

  // Label
  const label = document.createElement('span');
  label.textContent = options.label || '';
  item.appendChild(label);

  // Store state
  item._checked = !!options.checked;

  // Click handler
  if (!options.disabled) {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      item._checked = !item._checked;
      item.setAttribute('aria-checked', item._checked ? 'true' : 'false');
      
      // Update indicator
      indicator.innerHTML = '';
      if (item._checked) {
        const checkIcon = document.createElement('svg');
        checkIcon.setAttribute('viewBox', '0 0 24 24');
        checkIcon.setAttribute('fill', 'none');
        checkIcon.setAttribute('stroke', 'currentColor');
        checkIcon.setAttribute('stroke-width', '2');
        checkIcon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
        indicator.appendChild(checkIcon);
      }
      
      if (options.onCheckedChange) {
        options.onCheckedChange(item._checked);
      }
    });
  }

  return item;
}

/**
 * Create radio menu item
 * @param {Object} options - Configuration options
 * @param {string} [options.value] - Radio value
 * @param {string} [options.label] - Item text
 * @param {boolean} [options.checked=false] - Checked state
 * @param {boolean} [options.disabled=false] - Disable the item
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Radio menu item
 */
function createContextMenuRadioItem(options = {}) {
  const item = document.createElement('div');
  item.className = `context-menu-radio-item ${options.className || ''}`;
  item.setAttribute('role', 'menuitemradio');
  item.setAttribute('tabindex', '-1');
  item.setAttribute('aria-checked', options.checked ? 'true' : 'false');
  item.setAttribute('data-value', options.value || options.label || '');
  
  if (options.disabled) {
    item.setAttribute('data-disabled', 'true');
  }

  // Indicator
  const indicator = document.createElement('span');
  indicator.className = 'context-menu-item-indicator';
  
  if (options.checked) {
    const circleIcon = document.createElement('svg');
    circleIcon.setAttribute('viewBox', '0 0 24 24');
    circleIcon.setAttribute('fill', 'currentColor');
    circleIcon.setAttribute('stroke', 'currentColor');
    circleIcon.setAttribute('stroke-width', '2');
    circleIcon.innerHTML = '<circle cx="12" cy="12" r="4"/>';
    indicator.appendChild(circleIcon);
  }
  
  item.appendChild(indicator);

  // Label
  const label = document.createElement('span');
  label.textContent = options.label || options.value || '';
  item.appendChild(label);

  // Store state
  item._checked = !!options.checked;
  item._value = options.value || options.label || '';

  return item;
}

/**
 * Create radio group for mutually exclusive options
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Array of radio item configs
 * @param {string} [options.value] - Currently selected value
 * @param {Function} [options.onValueChange] - Callback when value changes
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Radio group container
 */
function createContextMenuRadioGroup(options = {}) {
  const group = document.createElement('div');
  group.className = `context-menu-radio-group ${options.className || ''}`;
  group.setAttribute('role', 'group');
  group._value = options.value || '';

  if (options.items && options.items.length > 0) {
    options.items.forEach(itemConfig => {
      const item = createContextMenuRadioItem({
        ...itemConfig,
        checked: itemConfig.value === options.value
      });

      // Click handler for radio selection
      if (!itemConfig.disabled) {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Uncheck all items in group
          group.querySelectorAll('.context-menu-radio-item').forEach(radioItem => {
            radioItem._checked = false;
            radioItem.setAttribute('aria-checked', 'false');
            const indicator = radioItem.querySelector('.context-menu-item-indicator');
            indicator.innerHTML = '';
          });
          
          // Check this item
          item._checked = true;
          item.setAttribute('aria-checked', 'true');
          const indicator = item.querySelector('.context-menu-item-indicator');
          indicator.innerHTML = '';
          const circleIcon = document.createElement('svg');
          circleIcon.setAttribute('viewBox', '0 0 24 24');
          circleIcon.setAttribute('fill', 'currentColor');
          circleIcon.setAttribute('stroke', 'currentColor');
          circleIcon.setAttribute('stroke-width', '2');
          circleIcon.innerHTML = '<circle cx="12" cy="12" r="4"/>';
          indicator.appendChild(circleIcon);
          
          group._value = item._value;
          
          if (options.onValueChange) {
            options.onValueChange(item._value);
          }
        });
      }

      group.appendChild(item);
    });
  }

  return group;
}

/**
 * Create menu label (non-interactive heading)
 * @param {Object} options - Configuration options
 * @param {string} [options.label] - Label text
 * @param {boolean} [options.inset=false] - Add left padding
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Label element
 */
function createContextMenuLabel(options = {}) {
  const label = document.createElement('div');
  label.className = `context-menu-label ${options.inset ? 'inset' : ''} ${options.className || ''}`;
  label.textContent = options.label || '';
  return label;
}

/**
 * Create menu separator
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Separator element
 */
function createContextMenuSeparator(options = {}) {
  const separator = document.createElement('div');
  separator.className = `context-menu-separator ${options.className || ''}`;
  separator.setAttribute('role', 'separator');
  return separator;
}

/**
 * Create submenu trigger with arrow
 * @param {Object} options - Configuration options
 * @param {string} [options.label] - Trigger text
 * @param {string} [options.icon] - SVG path for icon
 * @param {boolean} [options.disabled=false] - Disable the submenu
 * @param {boolean} [options.inset=false] - Add left padding
 * @param {HTMLElement} [options.content] - Submenu content
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Submenu trigger
 */
function createContextMenuSubTrigger(options = {}) {
  const trigger = document.createElement('div');
  trigger.className = `context-menu-submenu-trigger ${options.inset ? 'inset' : ''} ${options.className || ''}`;
  trigger.setAttribute('role', 'menuitem');
  trigger.setAttribute('tabindex', '-1');
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('data-state', 'closed');
  
  if (options.disabled) {
    trigger.setAttribute('data-disabled', 'true');
  }

  // Icon
  if (options.icon) {
    const icon = document.createElement('svg');
    icon.style.width = '16px';
    icon.style.height = '16px';
    icon.style.marginRight = '8px';
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.innerHTML = options.icon;
    trigger.appendChild(icon);
  }

  // Label
  const label = document.createElement('span');
  label.textContent = options.label || '';
  trigger.appendChild(label);

  // Chevron icon
  const chevron = document.createElement('svg');
  chevron.className = 'context-menu-submenu-icon';
  chevron.setAttribute('viewBox', '0 0 24 24');
  chevron.setAttribute('fill', 'none');
  chevron.setAttribute('stroke', 'currentColor');
  chevron.setAttribute('stroke-width', '2');
  chevron.innerHTML = '<polyline points="9 18 15 12 9 6"/>';
  trigger.appendChild(chevron);

  // Store content reference
  trigger._submenuContent = options.content;

  return trigger;
}

/**
 * Create submenu content container
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Submenu content
 */
function createContextMenuSubContent(options = {}) {
  const content = document.createElement('div');
  content.className = `context-menu-submenu-content ${options.className || ''}`;
  content.setAttribute('role', 'menu');
  content.style.display = 'none';
  return content;
}

/**
 * Create main context menu content container
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Context menu content
 */
function createContextMenuContent(options = {}) {
  const content = document.createElement('div');
  content.className = `context-menu-content ${options.className || ''}`;
  content.setAttribute('role', 'menu');
  content.style.display = 'none';
  return content;
}

/**
 * Attach context menu to trigger element
 * @param {HTMLElement} trigger - Element to attach context menu to
 * @param {HTMLElement} menu - Context menu content
 * @param {Object} options - Configuration options
 * @param {Function} [options.onOpenChange] - Callback when menu opens/closes
 * @returns {Object} Control functions
 */
function attachContextMenu(trigger, menu, options = {}) {
  let isOpen = false;
  let activeSubmenu = null;
  let submenuTimeout = null;

  // Position menu at cursor
  const positionMenu = (e, menuElement) => {
    const menuRect = menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = e.clientX;
    let y = e.clientY;

    // Adjust if menu would go off-screen
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 5;
    }
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 5;
    }

    menuElement.style.left = `${x}px`;
    menuElement.style.top = `${y}px`;
  };

  // Position submenu relative to trigger
  const positionSubmenu = (triggerElement, submenuElement) => {
    const triggerRect = triggerElement.getBoundingClientRect();
    const submenuRect = submenuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = triggerRect.right;
    let y = triggerRect.top;

    // Flip to left if would go off-screen
    if (x + submenuRect.width > viewportWidth) {
      x = triggerRect.left - submenuRect.width;
    }

    // Adjust vertical if would go off-screen
    if (y + submenuRect.height > viewportHeight) {
      y = viewportHeight - submenuRect.height - 5;
    }

    submenuElement.style.left = `${x}px`;
    submenuElement.style.top = `${y}px`;
  };

  // Close all submenus
  const closeSubmenus = () => {
    if (activeSubmenu) {
      activeSubmenu.style.display = 'none';
      const triggers = menu.querySelectorAll('.context-menu-submenu-trigger');
      triggers.forEach(t => t.setAttribute('data-state', 'closed'));
      activeSubmenu = null;
    }
  };

  // Open menu
  const open = (e) => {
    e.preventDefault();
    menu.style.display = 'block';
    document.body.appendChild(menu);
    positionMenu(e, menu);
    isOpen = true;

    if (options.onOpenChange) {
      options.onOpenChange(true);
    }

    // Focus first item
    setTimeout(() => {
      const firstItem = menu.querySelector('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]');
      if (firstItem) {
        firstItem.focus();
      }
    }, 50);
  };

  // Close menu
  const close = () => {
    menu.style.display = 'none';
    closeSubmenus();
    isOpen = false;

    if (options.onOpenChange) {
      options.onOpenChange(false);
    }
  };

  // Right-click to open
  trigger.addEventListener('contextmenu', open);

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (isOpen && !menu.contains(e.target)) {
      close();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  });

  // Close menu when item is clicked
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.context-menu-item, .context-menu-checkbox-item, .context-menu-radio-item');
    if (item && !item.hasAttribute('data-disabled')) {
      // Don't close on checkbox/radio items
      if (!item.classList.contains('context-menu-checkbox-item') && 
          !item.classList.contains('context-menu-radio-item')) {
        close();
      }
    }
  });

  // Handle submenu triggers
  menu.addEventListener('mouseenter', (e) => {
    const trigger = e.target.closest('.context-menu-submenu-trigger');
    if (trigger && trigger._submenuContent) {
      clearTimeout(submenuTimeout);
      
      // Close other submenus
      closeSubmenus();
      
      // Open this submenu
      submenuTimeout = setTimeout(() => {
        trigger.setAttribute('data-state', 'open');
        const submenu = trigger._submenuContent;
        submenu.style.display = 'block';
        document.body.appendChild(submenu);
        positionSubmenu(trigger, submenu);
        activeSubmenu = submenu;
      }, 200);
    }
  }, true);

  menu.addEventListener('mouseleave', (e) => {
    const trigger = e.target.closest('.context-menu-submenu-trigger');
    if (trigger) {
      clearTimeout(submenuTimeout);
    }
  }, true);

  // Keyboard navigation
  menu.addEventListener('keydown', (e) => {
    const items = Array.from(menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'))
      .filter(item => !item.hasAttribute('data-disabled'));
    const currentIndex = items.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      items[prevIndex].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (currentIndex >= 0) {
        items[currentIndex].click();
      }
    }
  });

  return {
    open,
    close,
    isOpen: () => isOpen
  };
}

/**
 * Create simple context menu with items
 * @param {HTMLElement} trigger - Element to attach to
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Menu items configuration
 * @param {Function} [options.onOpenChange] - Open state callback
 * @returns {Object} Menu controls
 */
function createSimpleContextMenu(trigger, options = {}) {
  const menu = createContextMenuContent();

  if (options.items && options.items.length > 0) {
    options.items.forEach(itemConfig => {
      if (itemConfig.type === 'separator') {
        menu.appendChild(createContextMenuSeparator());
      } else if (itemConfig.type === 'label') {
        menu.appendChild(createContextMenuLabel(itemConfig));
      } else if (itemConfig.type === 'checkbox') {
        menu.appendChild(createContextMenuCheckboxItem(itemConfig));
      } else if (itemConfig.type === 'submenu') {
        const subContent = createContextMenuSubContent();
        if (itemConfig.items) {
          itemConfig.items.forEach(subItem => {
            if (subItem.type === 'separator') {
              subContent.appendChild(createContextMenuSeparator());
            } else {
              subContent.appendChild(createContextMenuItem(subItem));
            }
          });
        }
        const subTrigger = createContextMenuSubTrigger({
          ...itemConfig,
          content: subContent
        });
        menu.appendChild(subTrigger);
      } else {
        menu.appendChild(createContextMenuItem(itemConfig));
      }
    });
  }

  return attachContextMenu(trigger, menu, options);
}

// Common context menu icons
const ContextMenuIcons = {
  edit: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  paste: '<path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/>',
  delete: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  chevronRight: '<polyline points="9 18 15 12 9 6"/>'
};

// Dialog Component
// Modal dialogs with overlay, header, footer, and actions

/**
 * Create dialog overlay (backdrop)
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onClick] - Callback when overlay is clicked
 * @returns {HTMLElement} Overlay element
 */
function createDialogOverlay(options = {}) {
  const overlay = document.createElement('div');
  overlay.className = `dialog-overlay ${options.className || ''}`;
  overlay.style.display = 'none';

  if (options.onClick) {
    overlay.addEventListener('click', options.onClick);
  }

  return overlay;
}

/**
 * Create dialog close button
 * @param {Object} options - Configuration options
 * @param {Function} [options.onClick] - Callback when close button is clicked
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Close button
 */
function createDialogClose(options = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `dialog-close ${options.className || ''}`;
  button.setAttribute('aria-label', 'Close');

  // X icon
  const icon = document.createElement('svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';

  button.appendChild(icon);

  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }

  return button;
}

/**
 * Create dialog title
 * @param {Object} options - Configuration options
 * @param {string} [options.text] - Title text
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Title element
 */
function createDialogTitle(options = {}) {
  const title = document.createElement('h2');
  title.className = `dialog-title ${options.className || ''}`;
  title.textContent = options.text || '';
  return title;
}

/**
 * Create dialog description
 * @param {Object} options - Configuration options
 * @param {string} [options.text] - Description text
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Description element
 */
function createDialogDescription(options = {}) {
  const description = document.createElement('p');
  description.className = `dialog-description ${options.className || ''}`;
  description.textContent = options.text || '';
  return description;
}

/**
 * Create dialog header
 * @param {Object} options - Configuration options
 * @param {string} [options.title] - Title text
 * @param {string} [options.description] - Description text
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Header element
 */
function createDialogHeader(options = {}) {
  const header = document.createElement('div');
  header.className = `dialog-header ${options.className || ''}`;

  if (options.title) {
    const title = createDialogTitle({ text: options.title });
    header.appendChild(title);
  }

  if (options.description) {
    const description = createDialogDescription({ text: options.description });
    header.appendChild(description);
  }

  return header;
}

/**
 * Create dialog footer
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Footer element
 */
function createDialogFooter(options = {}) {
  const footer = document.createElement('div');
  footer.className = `dialog-footer ${options.className || ''}`;
  return footer;
}

/**
 * Create dialog content container
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Content container
 */
function createDialogContent(options = {}) {
  const content = document.createElement('div');
  content.className = `dialog-content ${options.className || ''}`;
  content.setAttribute('role', 'dialog');
  content.setAttribute('aria-modal', 'true');
  content.style.display = 'none';
  return content;
}

/**
 * Create and manage a dialog
 * @param {Object} options - Configuration options
 * @param {string} [options.title] - Dialog title
 * @param {string} [options.description] - Dialog description
 * @param {HTMLElement|string} [options.content] - Dialog body content
 * @param {Array} [options.actions] - Array of action button configs
 * @param {boolean} [options.open=false] - Initially open
 * @param {boolean} [options.closeOnOverlay=true] - Close when clicking overlay
 * @param {boolean} [options.closeOnEscape=true] - Close on Escape key
 * @param {boolean} [options.showClose=true] - Show close button
 * @param {Function} [options.onOpenChange] - Callback when open state changes
 * @param {string} [options.className] - Additional CSS classes for content
 * @returns {Object} Dialog controls
 */
function createDialog(options = {}) {
  const closeOnOverlay = options.closeOnOverlay !== false;
  const closeOnEscape = options.closeOnEscape !== false;
  const showClose = options.showClose !== false;

  // Create overlay
  const overlay = createDialogOverlay({
    onClick: closeOnOverlay ? () => controls.close() : null
  });

  // Create content
  const content = createDialogContent({ className: options.className });

  // Add header if title or description provided
  if (options.title || options.description) {
    const header = createDialogHeader({
      title: options.title,
      description: options.description
    });
    content.appendChild(header);
  }

  // Add body content
  if (options.content) {
    const body = document.createElement('div');
    body.className = 'dialog-body';
    
    if (typeof options.content === 'string') {
      body.innerHTML = options.content;
    } else {
      body.appendChild(options.content);
    }
    
    content.appendChild(body);
  }

  // Add footer with actions if provided
  if (options.actions && options.actions.length > 0) {
    const footer = createDialogFooter();
    
    options.actions.forEach(actionConfig => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = actionConfig.className || 'btn btn-primary';
      button.textContent = actionConfig.label || 'Action';
      
      if (actionConfig.variant) {
        button.classList.add(`btn-${actionConfig.variant}`);
      }
      
      button.addEventListener('click', () => {
        if (actionConfig.onClick) {
          actionConfig.onClick();
        }
        if (actionConfig.closeOnClick !== false) {
          controls.close();
        }
      });
      
      footer.appendChild(button);
    });
    
    content.appendChild(footer);
  }

  // Add close button
  if (showClose) {
    const closeButton = createDialogClose({
      onClick: () => controls.close()
    });
    content.appendChild(closeButton);
  }

  // Handle Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && closeOnEscape && content.style.display !== 'none') {
      e.preventDefault();
      controls.close();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Append to body
  document.body.appendChild(overlay);
  document.body.appendChild(content);

  const controls = {
    overlay,
    content,
    open: () => {
      overlay.style.display = 'block';
      content.style.display = 'grid';
      document.body.classList.add('dialog-open');
      
      // Focus first focusable element
      setTimeout(() => {
        const focusable = content.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
          focusable.focus();
        }
      }, 50);
      
      if (options.onOpenChange) {
        options.onOpenChange(true);
      }
    },
    close: () => {
      overlay.style.display = 'none';
      content.style.display = 'none';
      document.body.classList.remove('dialog-open');
      
      if (options.onOpenChange) {
        options.onOpenChange(false);
      }
    },
    toggle: () => {
      if (content.style.display === 'none') {
        controls.open();
      } else {
        controls.close();
      }
    },
    isOpen: () => content.style.display !== 'none',
    destroy: () => {
      document.removeEventListener('keydown', handleKeyDown);
      overlay.remove();
      content.remove();
      document.body.classList.remove('dialog-open');
    },
    setTitle: (text) => {
      const title = content.querySelector('.dialog-title');
      if (title) {
        title.textContent = text;
      }
    },
    setDescription: (text) => {
      const description = content.querySelector('.dialog-description');
      if (description) {
        description.textContent = text;
      }
    },
    setContent: (newContent) => {
      const body = content.querySelector('.dialog-body');
      if (body) {
        if (typeof newContent === 'string') {
          body.innerHTML = newContent;
        } else {
          body.innerHTML = '';
          body.appendChild(newContent);
        }
      }
    }
  };

  if (options.open) {
    controls.open();
  }

  return controls;
}

/**
 * Create a simple alert dialog
 * @param {Object} options - Configuration options
 * @param {string} options.title - Alert title
 * @param {string} options.message - Alert message
 * @param {string} [options.confirmText='OK'] - Confirm button text
 * @param {Function} [options.onConfirm] - Callback when confirmed
 * @param {string} [options.variant='default'] - Button variant
 * @returns {Object} Dialog controls
 */
function createAlertDialog(options = {}) {
  return createDialog({
    title: options.title,
    description: options.message,
    showClose: false,
    actions: [
      {
        label: options.confirmText || 'OK',
        variant: options.variant || 'default',
        onClick: options.onConfirm,
        closeOnClick: true
      }
    ],
    onOpenChange: options.onOpenChange
  });
}

/**
 * Create a confirmation dialog
 * @param {Object} options - Configuration options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Confirmation message
 * @param {string} [options.confirmText='Confirm'] - Confirm button text
 * @param {string} [options.cancelText='Cancel'] - Cancel button text
 * @param {Function} [options.onConfirm] - Callback when confirmed
 * @param {Function} [options.onCancel] - Callback when cancelled
 * @param {string} [options.variant='default'] - Confirm button variant
 * @returns {Object} Dialog controls
 */
function createConfirmDialog(options = {}) {
  return createDialog({
    title: options.title,
    description: options.message,
    showClose: true,
    actions: [
      {
        label: options.cancelText || 'Cancel',
        variant: 'outline',
        onClick: options.onCancel,
        closeOnClick: true
      },
      {
        label: options.confirmText || 'Confirm',
        variant: options.variant || 'default',
        onClick: options.onConfirm,
        closeOnClick: true
      }
    ],
    onOpenChange: options.onOpenChange
  });
}

/**
 * Create a destructive confirmation dialog
 * @param {Object} options - Configuration options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Warning message
 * @param {string} [options.confirmText='Delete'] - Confirm button text
 * @param {string} [options.cancelText='Cancel'] - Cancel button text
 * @param {Function} [options.onConfirm] - Callback when confirmed
 * @param {Function} [options.onCancel] - Callback when cancelled
 * @returns {Object} Dialog controls
 */
function createDeleteDialog(options = {}) {
  return createConfirmDialog({
    title: options.title || 'Are you sure?',
    message: options.message || 'This action cannot be undone.',
    confirmText: options.confirmText || 'Delete',
    cancelText: options.cancelText || 'Cancel',
    variant: 'destructive',
    onConfirm: options.onConfirm,
    onCancel: options.onCancel,
    onOpenChange: options.onOpenChange
  });
}

/**
 * Create a form dialog
 * @param {Object} options - Configuration options
 * @param {string} options.title - Dialog title
 * @param {string} [options.description] - Dialog description
 * @param {Array} options.fields - Array of form field configs
 * @param {string} [options.submitText='Submit'] - Submit button text
 * @param {string} [options.cancelText='Cancel'] - Cancel button text
 * @param {Function} [options.onSubmit] - Callback with form data
 * @param {Function} [options.onCancel] - Callback when cancelled
 * @returns {Object} Dialog controls
 */
function createFormDialog(options = {}) {
  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '12px';

  // Create form fields
  if (options.fields && options.fields.length > 0) {
    options.fields.forEach(field => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.style.display = 'flex';
      fieldWrapper.style.flexDirection = 'column';
      fieldWrapper.style.gap = '6px';

      // Label
      const label = document.createElement('label');
      label.textContent = field.label || '';
      label.style.fontSize = '14px';
      label.style.fontWeight = '500';
      fieldWrapper.appendChild(label);

      // Input
      let input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = field.rows || 4;
      } else if (field.type === 'select') {
        input = document.createElement('select');
        if (field.options) {
          field.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value || opt;
            option.textContent = opt.label || opt;
            input.appendChild(option);
          });
        }
      } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
      }

      input.name = field.name || '';
      input.placeholder = field.placeholder || '';
      input.required = !!field.required;
      input.value = field.value || '';
      
      input.style.padding = '8px 12px';
      input.style.border = '1px solid var(--border-color)';
      input.style.borderRadius = '4px';
      input.style.fontSize = '14px';
      input.style.background = 'var(--bg-primary)';
      input.style.color = 'var(--text-primary)';

      fieldWrapper.appendChild(input);
      form.appendChild(fieldWrapper);
    });
  }

  const dialog = createDialog({
    title: options.title,
    description: options.description,
    content: form,
    showClose: true,
    actions: [
      {
        label: options.cancelText || 'Cancel',
        variant: 'outline',
        onClick: options.onCancel,
        closeOnClick: true
      },
      {
        label: options.submitText || 'Submit',
        variant: 'default',
        onClick: () => {
          // Collect form data
          const formData = new FormData(form);
          const data = {};
          formData.forEach((value, key) => {
            data[key] = value;
          });
          
          if (options.onSubmit) {
            options.onSubmit(data);
          }
        },
        closeOnClick: true
      }
    ],
    onOpenChange: options.onOpenChange
  });

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitButton = dialog.content.querySelector('.dialog-footer button:last-child');
    if (submitButton) {
      submitButton.click();
    }
  });

  return dialog;
}

/**
 * Show a quick alert message
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Function} [onClose] - Callback when closed
 * @returns {Object} Dialog controls
 */
function showAlert(title, message, onClose) {
  const dialog = createAlertDialog({
    title,
    message,
    onConfirm: onClose,
    open: false
  });
  dialog.open();
  return dialog;
}

/**
 * Show a confirmation prompt
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} [onCancel] - Callback when cancelled
 * @returns {Object} Dialog controls
 */
function showConfirm(title, message, onConfirm, onCancel) {
  const dialog = createConfirmDialog({
    title,
    message,
    onConfirm,
    onCancel,
    open: false
  });
  dialog.open();
  return dialog;
}

/**
 * Show a delete confirmation
 * @param {string} itemName - Name of item to delete
 * @param {Function} onConfirm - Callback when confirmed
 * @returns {Object} Dialog controls
 */
function showDeleteConfirm(itemName, onConfirm) {
  const dialog = createDeleteDialog({
    title: `Delete ${itemName}?`,
    message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    onConfirm,
    open: false
  });
  dialog.open();
  return dialog;
}

// Drawer Component (Bottom Sheet)
// Mobile-friendly drawer that slides up from bottom with drag-to-close

/**
 * Create drawer overlay (backdrop)
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onClick] - Callback when overlay is clicked
 * @returns {HTMLElement} Overlay element
 */
function createDrawerOverlay(options = {}) {
  const overlay = document.createElement('div');
  overlay.className = `drawer-overlay ${options.className || ''}`;
  overlay.style.display = 'none';

  if (options.onClick) {
    overlay.addEventListener('click', options.onClick);
  }

  return overlay;
}

/**
 * Create drag handle for drawer
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Handle element
 */
function createDrawerHandle(options = {}) {
  const handle = document.createElement('div');
  handle.className = `drawer-handle ${options.className || ''}`;
  handle.setAttribute('aria-hidden', 'true');
  return handle;
}

/**
 * Create drawer title
 * @param {Object} options - Configuration options
 * @param {string} [options.text] - Title text
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Title element
 */
function createDrawerTitle(options = {}) {
  const title = document.createElement('h2');
  title.className = `drawer-title ${options.className || ''}`;
  title.textContent = options.text || '';
  return title;
}

/**
 * Create drawer description
 * @param {Object} options - Configuration options
 * @param {string} [options.text] - Description text
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Description element
 */
function createDrawerDescription(options = {}) {
  const description = document.createElement('p');
  description.className = `drawer-description ${options.className || ''}`;
  description.textContent = options.text || '';
  return description;
}

/**
 * Create drawer header
 * @param {Object} options - Configuration options
 * @param {string} [options.title] - Title text
 * @param {string} [options.description] - Description text
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Header element
 */
function createDrawerHeader(options = {}) {
  const header = document.createElement('div');
  header.className = `drawer-header ${options.className || ''}`;

  if (options.title) {
    const title = createDrawerTitle({ text: options.title });
    header.appendChild(title);
  }

  if (options.description) {
    const description = createDrawerDescription({ text: options.description });
    header.appendChild(description);
  }

  return header;
}

/**
 * Create drawer footer
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Footer element
 */
function createDrawerFooter(options = {}) {
  const footer = document.createElement('div');
  footer.className = `drawer-footer ${options.className || ''}`;
  return footer;
}

/**
 * Create drawer body content area
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Body element
 */
function createDrawerBody(options = {}) {
  const body = document.createElement('div');
  body.className = `drawer-body ${options.className || ''}`;
  return body;
}

/**
 * Create drawer content container
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Content container
 */
function createDrawerContent(options = {}) {
  const content = document.createElement('div');
  content.className = `drawer-content ${options.className || ''}`;
  content.setAttribute('role', 'dialog');
  content.setAttribute('aria-modal', 'true');
  content.style.display = 'none';
  return content;
}

/**
 * Add drag-to-close functionality to drawer
 * @param {HTMLElement} drawer - Drawer content element
 * @param {HTMLElement} handle - Drag handle element
 * @param {Function} onClose - Callback to close drawer
 */
function enableDrawerDrag(drawer, handle, onClose) {
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let initialHeight = 0;

  const handleTouchStart = (e) => {
    isDragging = true;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    initialHeight = drawer.offsetHeight;
    drawer.style.transition = 'none';
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY;

    // Only allow dragging down
    if (deltaY > 0) {
      drawer.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;

    const deltaY = currentY - startY;
    const threshold = initialHeight * 0.3; // Close if dragged more than 30% of height

    drawer.style.transition = 'transform 0.3s ease-out';

    if (deltaY > threshold) {
      // Close drawer
      drawer.style.transform = `translateY(100%)`;
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      // Snap back
      drawer.style.transform = 'translateY(0)';
    }

    setTimeout(() => {
      drawer.style.transition = '';
      drawer.style.transform = '';
    }, 300);
  };

  // Touch events
  handle.addEventListener('touchstart', handleTouchStart);
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', handleTouchEnd);

  // Mouse events (for desktop testing)
  handle.addEventListener('mousedown', handleTouchStart);
  document.addEventListener('mousemove', handleTouchMove);
  document.addEventListener('mouseup', handleTouchEnd);

  // Cleanup function
  return () => {
    handle.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    handle.removeEventListener('mousedown', handleTouchStart);
    document.removeEventListener('mousemove', handleTouchMove);
    document.removeEventListener('mouseup', handleTouchEnd);
  };
}

/**
 * Create and manage a drawer
 * @param {Object} options - Configuration options
 * @param {string} [options.title] - Drawer title
 * @param {string} [options.description] - Drawer description
 * @param {HTMLElement|string} [options.content] - Drawer body content
 * @param {Array} [options.actions] - Array of action button configs
 * @param {boolean} [options.open=false] - Initially open
 * @param {boolean} [options.closeOnOverlay=true] - Close when clicking overlay
 * @param {boolean} [options.closeOnEscape=true] - Close on Escape key
 * @param {boolean} [options.enableDrag=true] - Enable drag-to-close
 * @param {boolean} [options.scaleBackground=true] - Scale background when open
 * @param {Function} [options.onOpenChange] - Callback when open state changes
 * @param {string} [options.className] - Additional CSS classes for content
 * @returns {Object} Drawer controls
 */
function createDrawer(options = {}) {
  const closeOnOverlay = options.closeOnOverlay !== false;
  const closeOnEscape = options.closeOnEscape !== false;
  const enableDrag = options.enableDrag !== false;
  const scaleBackground = options.scaleBackground !== false;

  // Create overlay
  const overlay = createDrawerOverlay({
    onClick: closeOnOverlay ? () => controls.close() : null
  });

  // Create content
  const content = createDrawerContent({ className: options.className });

  // Add drag handle
  const handle = createDrawerHandle();
  content.appendChild(handle);

  // Add header if title or description provided
  if (options.title || options.description) {
    const header = createDrawerHeader({
      title: options.title,
      description: options.description
    });
    content.appendChild(header);
  }

  // Add body content
  const body = createDrawerBody();
  if (options.content) {
    if (typeof options.content === 'string') {
      body.innerHTML = options.content;
    } else {
      body.appendChild(options.content);
    }
  }
  content.appendChild(body);

  // Add footer with actions if provided
  if (options.actions && options.actions.length > 0) {
    const footer = createDrawerFooter();
    
    options.actions.forEach(actionConfig => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = actionConfig.className || 'btn btn-primary';
      button.textContent = actionConfig.label || 'Action';
      
      if (actionConfig.variant) {
        button.classList.add(`btn-${actionConfig.variant}`);
      }
      
      button.addEventListener('click', () => {
        if (actionConfig.onClick) {
          actionConfig.onClick();
        }
        if (actionConfig.closeOnClick !== false) {
          controls.close();
        }
      });
      
      footer.appendChild(button);
    });
    
    content.appendChild(footer);
  }

  // Handle Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && closeOnEscape && content.style.display !== 'none') {
      e.preventDefault();
      controls.close();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Enable drag-to-close
  let cleanupDrag = null;
  if (enableDrag) {
    cleanupDrag = enableDrawerDrag(content, handle, () => controls.close());
  }

  // Append to body
  document.body.appendChild(overlay);
  document.body.appendChild(content);

  const controls = {
    overlay,
    content,
    open: () => {
      overlay.style.display = 'block';
      content.style.display = 'flex';
      document.body.classList.add('drawer-open');
      
      if (scaleBackground) {
        document.body.classList.add('drawer-scale-background');
      }
      
      // Focus first focusable element
      setTimeout(() => {
        const focusable = content.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
          focusable.focus();
        }
      }, 50);
      
      if (options.onOpenChange) {
        options.onOpenChange(true);
      }
    },
    close: () => {
      // Add closing animation
      content.classList.add('closing');
      
      setTimeout(() => {
        overlay.style.display = 'none';
        content.style.display = 'none';
        content.classList.remove('closing');
        document.body.classList.remove('drawer-open');
        document.body.classList.remove('drawer-scale-background');
        
        if (options.onOpenChange) {
          options.onOpenChange(false);
        }
      }, 300);
    },
    toggle: () => {
      if (content.style.display === 'none') {
        controls.open();
      } else {
        controls.close();
      }
    },
    isOpen: () => content.style.display !== 'none',
    destroy: () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (cleanupDrag) {
        cleanupDrag();
      }
      overlay.remove();
      content.remove();
      document.body.classList.remove('drawer-open');
      document.body.classList.remove('drawer-scale-background');
    },
    setTitle: (text) => {
      const title = content.querySelector('.drawer-title');
      if (title) {
        title.textContent = text;
      }
    },
    setDescription: (text) => {
      const description = content.querySelector('.drawer-description');
      if (description) {
        description.textContent = text;
      }
    },
    setContent: (newContent) => {
      const bodyEl = content.querySelector('.drawer-body');
      if (bodyEl) {
        if (typeof newContent === 'string') {
          bodyEl.innerHTML = newContent;
        } else {
          bodyEl.innerHTML = '';
          bodyEl.appendChild(newContent);
        }
      }
    }
  };

  if (options.open) {
    controls.open();
  }

  return controls;
}

/**
 * Create a simple drawer with content
 * @param {Object} options - Configuration options
 * @param {string} options.title - Drawer title
 * @param {string} [options.description] - Drawer description
 * @param {HTMLElement|string} options.content - Drawer content
 * @param {Function} [options.onClose] - Callback when closed
 * @returns {Object} Drawer controls
 */
function createSimpleDrawer(options = {}) {
  return createDrawer({
    title: options.title,
    description: options.description,
    content: options.content,
    onOpenChange: (open) => {
      if (!open && options.onClose) {
        options.onClose();
      }
    }
  });
}

/**
 * Create a drawer with action buttons
 * @param {Object} options - Configuration options
 * @param {string} options.title - Drawer title
 * @param {string} [options.description] - Drawer description
 * @param {HTMLElement|string} options.content - Drawer content
 * @param {string} [options.confirmText='Confirm'] - Confirm button text
 * @param {string} [options.cancelText='Cancel'] - Cancel button text
 * @param {Function} [options.onConfirm] - Callback when confirmed
 * @param {Function} [options.onCancel] - Callback when cancelled
 * @returns {Object} Drawer controls
 */
function createActionDrawer(options = {}) {
  return createDrawer({
    title: options.title,
    description: options.description,
    content: options.content,
    actions: [
      {
        label: options.cancelText || 'Cancel',
        variant: 'outline',
        onClick: options.onCancel,
        closeOnClick: true
      },
      {
        label: options.confirmText || 'Confirm',
        variant: 'default',
        onClick: options.onConfirm,
        closeOnClick: true
      }
    ]
  });
}

/**
 * Create a form drawer
 * @param {Object} options - Configuration options
 * @param {string} options.title - Drawer title
 * @param {string} [options.description] - Drawer description
 * @param {Array} options.fields - Array of form field configs
 * @param {string} [options.submitText='Submit'] - Submit button text
 * @param {string} [options.cancelText='Cancel'] - Cancel button text
 * @param {Function} [options.onSubmit] - Callback with form data
 * @param {Function} [options.onCancel] - Callback when cancelled
 * @returns {Object} Drawer controls
 */
function createFormDrawer(options = {}) {
  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '12px';
  form.style.padding = '8px 0';

  // Create form fields
  if (options.fields && options.fields.length > 0) {
    options.fields.forEach(field => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.style.display = 'flex';
      fieldWrapper.style.flexDirection = 'column';
      fieldWrapper.style.gap = '6px';

      // Label
      const label = document.createElement('label');
      label.textContent = field.label || '';
      label.style.fontSize = '14px';
      label.style.fontWeight = '500';
      fieldWrapper.appendChild(label);

      // Input
      let input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = field.rows || 4;
      } else if (field.type === 'select') {
        input = document.createElement('select');
        if (field.options) {
          field.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value || opt;
            option.textContent = opt.label || opt;
            input.appendChild(option);
          });
        }
      } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
      }

      input.name = field.name || '';
      input.placeholder = field.placeholder || '';
      input.required = !!field.required;
      input.value = field.value || '';
      
      input.style.padding = '8px 12px';
      input.style.border = '1px solid var(--border-color)';
      input.style.borderRadius = '4px';
      input.style.fontSize = '14px';
      input.style.background = 'var(--bg-primary)';
      input.style.color = 'var(--text-primary)';

      fieldWrapper.appendChild(input);
      form.appendChild(fieldWrapper);
    });
  }

  const drawer = createDrawer({
    title: options.title,
    description: options.description,
    content: form,
    actions: [
      {
        label: options.cancelText || 'Cancel',
        variant: 'outline',
        onClick: options.onCancel,
        closeOnClick: true
      },
      {
        label: options.submitText || 'Submit',
        variant: 'default',
        onClick: () => {
          // Collect form data
          const formData = new FormData(form);
          const data = {};
          formData.forEach((value, key) => {
            data[key] = value;
          });
          
          if (options.onSubmit) {
            options.onSubmit(data);
          }
        },
        closeOnClick: true
      }
    ]
  });

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitButton = drawer.content.querySelector('.drawer-footer button:last-child');
    if (submitButton) {
      submitButton.click();
    }
  });

  return drawer;
}

/**
 * Create a menu drawer (mobile-friendly navigation)
 * @param {Object} options - Configuration options
 * @param {string} [options.title='Menu'] - Drawer title
 * @param {Array} options.items - Array of menu item configs
 * @param {Function} [options.onSelect] - Callback when item is selected
 * @returns {Object} Drawer controls
 */
function createMenuDrawer(options = {}) {
  const menu = document.createElement('div');
  menu.style.display = 'flex';
  menu.style.flexDirection = 'column';
  menu.style.gap = '4px';

  if (options.items && options.items.length > 0) {
    options.items.forEach(item => {
      if (item.type === 'separator') {
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.background = 'var(--border-color)';
        separator.style.margin = '8px 0';
        menu.appendChild(separator);
      } else if (item.type === 'label') {
        const label = document.createElement('div');
        label.textContent = item.label;
        label.style.fontSize = '12px';
        label.style.fontWeight = '600';
        label.style.color = 'var(--text-muted)';
        label.style.padding = '8px 12px';
        label.style.textTransform = 'uppercase';
        label.style.letterSpacing = '0.05em';
        menu.appendChild(label);
      } else {
        const menuItem = document.createElement('button');
        menuItem.type = 'button';
        menuItem.className = 'context-menu-item';
        menuItem.style.width = '100%';
        menuItem.style.justifyContent = 'flex-start';
        menuItem.textContent = item.label || '';
        
        if (item.icon) {
          const icon = document.createElement('svg');
          icon.style.width = '16px';
          icon.style.height = '16px';
          icon.style.marginRight = '8px';
          icon.setAttribute('viewBox', '0 0 24 24');
          icon.setAttribute('fill', 'none');
          icon.setAttribute('stroke', 'currentColor');
          icon.setAttribute('stroke-width', '2');
          icon.innerHTML = item.icon;
          menuItem.insertBefore(icon, menuItem.firstChild);
        }

        menuItem.addEventListener('click', () => {
          if (item.onClick) {
            item.onClick();
          }
          if (options.onSelect) {
            options.onSelect(item);
          }
          drawer.close();
        });

        menu.appendChild(menuItem);
      }
    });
  }

  const drawer = createDrawer({
    title: options.title || 'Menu',
    content: menu
  });

  return drawer;
}

// Dropdown Menu Component
// Click-triggered dropdown menus with submenus, checkboxes, and radio items

/**
 * Create dropdown menu item
 * @param {Object} options - Configuration options
 * @param {string} [options.label] - Item text
 * @param {string} [options.icon] - SVG path for icon
 * @param {string} [options.shortcut] - Keyboard shortcut display
 * @param {boolean} [options.disabled=false] - Disable the item
 * @param {boolean} [options.inset=false] - Add left padding
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onSelect] - Callback when item is selected
 * @returns {HTMLElement} Dropdown menu item
 */
function createDropdownMenuItem(options = {}) {
  const item = document.createElement('div');
  item.className = `dropdown-menu-item ${options.inset ? 'inset' : ''} ${options.className || ''}`;
  item.setAttribute('role', 'menuitem');
  item.setAttribute('tabindex', '-1');
  
  if (options.disabled) {
    item.setAttribute('data-disabled', 'true');
  }

  // Icon
  if (options.icon) {
    const icon = document.createElement('svg');
    icon.style.width = '16px';
    icon.style.height = '16px';
    icon.style.marginRight = '8px';
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.innerHTML = options.icon;
    item.appendChild(icon);
  }

  // Label
  const label = document.createElement('span');
  label.textContent = options.label || '';
  item.appendChild(label);

  // Shortcut
  if (options.shortcut) {
    const shortcut = document.createElement('span');
    shortcut.className = 'dropdown-menu-shortcut';
    shortcut.textContent = options.shortcut;
    item.appendChild(shortcut);
  }

  // Click handler
  if (!options.disabled && options.onSelect) {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      options.onSelect();
    });
  }

  return item;
}

/**
 * Create checkbox menu item
 * @param {Object} options - Configuration options
 * @param {string} [options.label] - Item text
 * @param {boolean} [options.checked=false] - Checked state
 * @param {boolean} [options.disabled=false] - Disable the item
 * @param {string} [options.className] - Additional CSS classes
 * @param {Function} [options.onCheckedChange] - Callback when checked state changes
 * @returns {HTMLElement} Checkbox menu item
 */
function createDropdownMenuCheckboxItem(options = {}) {
  const item = document.createElement('div');
  item.className = `dropdown-menu-checkbox-item ${options.className || ''}`;
  item.setAttribute('role', 'menuitemcheckbox');
  item.setAttribute('tabindex', '-1');
  item.setAttribute('aria-checked', options.checked ? 'true' : 'false');
  
  if (options.disabled) {
    item.setAttribute('data-disabled', 'true');
  }

  // Indicator
  const indicator = document.createElement('span');
  indicator.className = 'dropdown-menu-item-indicator';
  
  if (options.checked) {
    const checkIcon = document.createElement('svg');
    checkIcon.setAttribute('viewBox', '0 0 24 24');
    checkIcon.setAttribute('fill', 'none');
    checkIcon.setAttribute('stroke', 'currentColor');
    checkIcon.setAttribute('stroke-width', '2');
    checkIcon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
    indicator.appendChild(checkIcon);
  }
  
  item.appendChild(indicator);

  // Label
  const label = document.createElement('span');
  label.textContent = options.label || '';
  item.appendChild(label);

  // Store state
  item._checked = !!options.checked;

  // Click handler
  if (!options.disabled) {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      item._checked = !item._checked;
      item.setAttribute('aria-checked', item._checked ? 'true' : 'false');
      
      // Update indicator
      indicator.innerHTML = '';
      if (item._checked) {
        const checkIcon = document.createElement('svg');
        checkIcon.setAttribute('viewBox', '0 0 24 24');
        checkIcon.setAttribute('fill', 'none');
        checkIcon.setAttribute('stroke', 'currentColor');
        checkIcon.setAttribute('stroke-width', '2');
        checkIcon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
        indicator.appendChild(checkIcon);
      }
      
      if (options.onCheckedChange) {
        options.onCheckedChange(item._checked);
      }
    });
  }

  return item;
}

/**
 * Create radio menu item
 * @param {Object} options - Configuration options
 * @param {string} [options.value] - Radio value
 * @param {string} [options.label] - Item text
 * @param {boolean} [options.checked=false] - Checked state
 * @param {boolean} [options.disabled=false] - Disable the item
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Radio menu item
 */
function createDropdownMenuRadioItem(options = {}) {
  const item = document.createElement('div');
  item.className = `dropdown-menu-radio-item ${options.className || ''}`;
  item.setAttribute('role', 'menuitemradio');
  item.setAttribute('tabindex', '-1');
  item.setAttribute('aria-checked', options.checked ? 'true' : 'false');
  item.setAttribute('data-value', options.value || options.label || '');
  
  if (options.disabled) {
    item.setAttribute('data-disabled', 'true');
  }

  // Indicator
  const indicator = document.createElement('span');
  indicator.className = 'dropdown-menu-item-indicator';
  
  if (options.checked) {
    const circleIcon = document.createElement('svg');
    circleIcon.setAttribute('viewBox', '0 0 24 24');
    circleIcon.setAttribute('fill', 'currentColor');
    circleIcon.setAttribute('stroke', 'currentColor');
    circleIcon.setAttribute('stroke-width', '2');
    circleIcon.innerHTML = '<circle cx="12" cy="12" r="4"/>';
    indicator.appendChild(circleIcon);
  }
  
  item.appendChild(indicator);

  // Label
  const label = document.createElement('span');
  label.textContent = options.label || options.value || '';
  item.appendChild(label);

  // Store state
  item._checked = !!options.checked;
  item._value = options.value || options.label || '';

  return item;
}

/**
 * Create radio group for mutually exclusive options
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Array of radio item configs
 * @param {string} [options.value] - Currently selected value
 * @param {Function} [options.onValueChange] - Callback when value changes
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Radio group container
 */
function createDropdownMenuRadioGroup(options = {}) {
  const group = document.createElement('div');
  group.className = `dropdown-menu-radio-group ${options.className || ''}`;
  group.setAttribute('role', 'group');
  group._value = options.value || '';

  if (options.items && options.items.length > 0) {
    options.items.forEach(itemConfig => {
      const item = createDropdownMenuRadioItem({
        ...itemConfig,
        checked: itemConfig.value === options.value
      });

      // Click handler for radio selection
      if (!itemConfig.disabled) {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Uncheck all items in group
          group.querySelectorAll('.dropdown-menu-radio-item').forEach(radioItem => {
            radioItem._checked = false;
            radioItem.setAttribute('aria-checked', 'false');
            const indicator = radioItem.querySelector('.dropdown-menu-item-indicator');
            indicator.innerHTML = '';
          });
          
          // Check this item
          item._checked = true;
          item.setAttribute('aria-checked', 'true');
          const indicator = item.querySelector('.dropdown-menu-item-indicator');
          indicator.innerHTML = '';
          const circleIcon = document.createElement('svg');
          circleIcon.setAttribute('viewBox', '0 0 24 24');
          circleIcon.setAttribute('fill', 'currentColor');
          circleIcon.setAttribute('stroke', 'currentColor');
          circleIcon.setAttribute('stroke-width', '2');
          circleIcon.innerHTML = '<circle cx="12" cy="12" r="4"/>';
          indicator.appendChild(circleIcon);
          
          group._value = item._value;
          
          if (options.onValueChange) {
            options.onValueChange(item._value);
          }
        });
      }

      group.appendChild(item);
    });
  }

  return group;
}

/**
 * Create menu label (non-interactive heading)
 * @param {Object} options - Configuration options
 * @param {string} [options.label] - Label text
 * @param {boolean} [options.inset=false] - Add left padding
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Label element
 */
function createDropdownMenuLabel(options = {}) {
  const label = document.createElement('div');
  label.className = `dropdown-menu-label ${options.inset ? 'inset' : ''} ${options.className || ''}`;
  label.textContent = options.label || '';
  return label;
}

/**
 * Create menu separator
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Separator element
 */
function createDropdownMenuSeparator(options = {}) {
  const separator = document.createElement('div');
  separator.className = `dropdown-menu-separator ${options.className || ''}`;
  separator.setAttribute('role', 'separator');
  return separator;
}

/**
 * Create submenu trigger with arrow
 * @param {Object} options - Configuration options
 * @param {string} [options.label] - Trigger text
 * @param {string} [options.icon] - SVG path for icon
 * @param {boolean} [options.disabled=false] - Disable the submenu
 * @param {boolean} [options.inset=false] - Add left padding
 * @param {HTMLElement} [options.content] - Submenu content
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Submenu trigger
 */
function createDropdownMenuSubTrigger(options = {}) {
  const trigger = document.createElement('div');
  trigger.className = `dropdown-menu-submenu-trigger ${options.inset ? 'inset' : ''} ${options.className || ''}`;
  trigger.setAttribute('role', 'menuitem');
  trigger.setAttribute('tabindex', '-1');
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('data-state', 'closed');
  
  if (options.disabled) {
    trigger.setAttribute('data-disabled', 'true');
  }

  // Icon
  if (options.icon) {
    const icon = document.createElement('svg');
    icon.style.width = '16px';
    icon.style.height = '16px';
    icon.style.marginRight = '8px';
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.innerHTML = options.icon;
    trigger.appendChild(icon);
  }

  // Label
  const label = document.createElement('span');
  label.textContent = options.label || '';
  trigger.appendChild(label);

  // Chevron icon
  const chevron = document.createElement('svg');
  chevron.className = 'dropdown-menu-submenu-icon';
  chevron.setAttribute('viewBox', '0 0 24 24');
  chevron.setAttribute('fill', 'none');
  chevron.setAttribute('stroke', 'currentColor');
  chevron.setAttribute('stroke-width', '2');
  chevron.innerHTML = '<polyline points="9 18 15 12 9 6"/>';
  trigger.appendChild(chevron);

  // Store content reference
  trigger._submenuContent = options.content;

  return trigger;
}

/**
 * Create submenu content container
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Submenu content
 */
function createDropdownMenuSubContent(options = {}) {
  const content = document.createElement('div');
  content.className = `dropdown-menu-submenu-content ${options.className || ''}`;
  content.setAttribute('role', 'menu');
  content.style.display = 'none';
  return content;
}

/**
 * Create main dropdown menu content container
 * @param {Object} options - Configuration options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Dropdown menu content
 */
function createDropdownMenuContent(options = {}) {
  const content = document.createElement('div');
  content.className = `dropdown-menu-content ${options.className || ''}`;
  content.setAttribute('role', 'menu');
  content.style.display = 'none';
  return content;
}

/**
 * Attach dropdown menu to trigger element
 * @param {HTMLElement} trigger - Button or element to trigger menu
 * @param {HTMLElement} menu - Dropdown menu content
 * @param {Object} options - Configuration options
 * @param {number} [options.offset=4] - Distance from trigger (pixels)
 * @param {string} [options.align='start'] - Alignment ('start', 'center', 'end')
 * @param {string} [options.side='bottom'] - Side to appear ('top', 'bottom', 'left', 'right')
 * @param {Function} [options.onOpenChange] - Callback when menu opens/closes
 * @returns {Object} Control functions
 */
function attachDropdownMenu(trigger, menu, options = {}) {
  const offset = options.offset !== undefined ? options.offset : 4;
  const align = options.align || 'start';
  const side = options.side || 'bottom';
  let isOpen = false;
  let activeSubmenu = null;
  let submenuTimeout = null;

  // Position menu relative to trigger
  const positionMenu = (menuElement) => {
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = 0;
    let y = 0;

    // Calculate position based on side
    if (side === 'bottom') {
      y = triggerRect.bottom + offset;
      
      // Align horizontally
      if (align === 'start') {
        x = triggerRect.left;
      } else if (align === 'center') {
        x = triggerRect.left + (triggerRect.width / 2) - (menuRect.width / 2);
      } else if (align === 'end') {
        x = triggerRect.right - menuRect.width;
      }
    } else if (side === 'top') {
      y = triggerRect.top - menuRect.height - offset;
      
      if (align === 'start') {
        x = triggerRect.left;
      } else if (align === 'center') {
        x = triggerRect.left + (triggerRect.width / 2) - (menuRect.width / 2);
      } else if (align === 'end') {
        x = triggerRect.right - menuRect.width;
      }
    } else if (side === 'left') {
      x = triggerRect.left - menuRect.width - offset;
      y = triggerRect.top;
    } else if (side === 'right') {
      x = triggerRect.right + offset;
      y = triggerRect.top;
    }

    // Adjust if menu would go off-screen
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 5;
    }
    if (x < 0) {
      x = 5;
    }
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 5;
    }
    if (y < 0) {
      y = 5;
    }

    menuElement.style.left = `${x}px`;
    menuElement.style.top = `${y}px`;
  };

  // Position submenu relative to trigger
  const positionSubmenu = (triggerElement, submenuElement) => {
    const triggerRect = triggerElement.getBoundingClientRect();
    const submenuRect = submenuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = triggerRect.right;
    let y = triggerRect.top;

    // Flip to left if would go off-screen
    if (x + submenuRect.width > viewportWidth) {
      x = triggerRect.left - submenuRect.width;
    }

    // Adjust vertical if would go off-screen
    if (y + submenuRect.height > viewportHeight) {
      y = viewportHeight - submenuRect.height - 5;
    }

    submenuElement.style.left = `${x}px`;
    submenuElement.style.top = `${y}px`;
  };

  // Close all submenus
  const closeSubmenus = () => {
    if (activeSubmenu) {
      activeSubmenu.style.display = 'none';
      const triggers = menu.querySelectorAll('.dropdown-menu-submenu-trigger');
      triggers.forEach(t => t.setAttribute('data-state', 'closed'));
      activeSubmenu = null;
    }
  };

  // Open menu
  const open = () => {
    menu.style.display = 'block';
    document.body.appendChild(menu);
    positionMenu(menu);
    isOpen = true;

    if (options.onOpenChange) {
      options.onOpenChange(true);
    }

    // Focus first item
    setTimeout(() => {
      const firstItem = menu.querySelector('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]');
      if (firstItem) {
        firstItem.focus();
      }
    }, 50);
  };

  // Close menu
  const close = () => {
    menu.style.display = 'none';
    closeSubmenus();
    isOpen = false;

    if (options.onOpenChange) {
      options.onOpenChange(false);
    }
  };

  // Toggle menu
  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  // Click trigger to toggle
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (isOpen && !menu.contains(e.target) && !trigger.contains(e.target)) {
      close();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  });

  // Close menu when item is clicked
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-menu-item, .dropdown-menu-checkbox-item, .dropdown-menu-radio-item');
    if (item && !item.hasAttribute('data-disabled')) {
      // Don't close on checkbox/radio items
      if (!item.classList.contains('dropdown-menu-checkbox-item') && 
          !item.classList.contains('dropdown-menu-radio-item')) {
        close();
      }
    }
  });

  // Handle submenu triggers
  menu.addEventListener('mouseenter', (e) => {
    const trigger = e.target.closest('.dropdown-menu-submenu-trigger');
    if (trigger && trigger._submenuContent) {
      clearTimeout(submenuTimeout);
      
      // Close other submenus
      closeSubmenus();
      
      // Open this submenu
      submenuTimeout = setTimeout(() => {
        trigger.setAttribute('data-state', 'open');
        const submenu = trigger._submenuContent;
        submenu.style.display = 'block';
        document.body.appendChild(submenu);
        positionSubmenu(trigger, submenu);
        activeSubmenu = submenu;
      }, 200);
    }
  }, true);

  menu.addEventListener('mouseleave', (e) => {
    const trigger = e.target.closest('.dropdown-menu-submenu-trigger');
    if (trigger) {
      clearTimeout(submenuTimeout);
    }
  }, true);

  // Keyboard navigation
  menu.addEventListener('keydown', (e) => {
    const items = Array.from(menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'))
      .filter(item => !item.hasAttribute('data-disabled'));
    const currentIndex = items.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      items[prevIndex].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (currentIndex >= 0) {
        items[currentIndex].click();
      }
    }
  });

  return {
    open,
    close,
    toggle,
    isOpen: () => isOpen
  };
}

/**
 * Create simple dropdown menu with items
 * @param {HTMLElement} trigger - Button to attach to
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Menu items configuration
 * @param {string} [options.align='start'] - Menu alignment
 * @param {string} [options.side='bottom'] - Menu side
 * @param {Function} [options.onOpenChange] - Open state callback
 * @returns {Object} Menu controls
 */
function createSimpleDropdownMenu(trigger, options = {}) {
  const menu = createDropdownMenuContent();

  if (options.items && options.items.length > 0) {
    options.items.forEach(itemConfig => {
      if (itemConfig.type === 'separator') {
        menu.appendChild(createDropdownMenuSeparator());
      } else if (itemConfig.type === 'label') {
        menu.appendChild(createDropdownMenuLabel(itemConfig));
      } else if (itemConfig.type === 'checkbox') {
        menu.appendChild(createDropdownMenuCheckboxItem(itemConfig));
      } else if (itemConfig.type === 'submenu') {
        const subContent = createDropdownMenuSubContent();
        if (itemConfig.items) {
          itemConfig.items.forEach(subItem => {
            if (subItem.type === 'separator') {
              subContent.appendChild(createDropdownMenuSeparator());
            } else {
              subContent.appendChild(createDropdownMenuItem(subItem));
            }
          });
        }
        const subTrigger = createDropdownMenuSubTrigger({
          ...itemConfig,
          content: subContent
        });
        menu.appendChild(subTrigger);
      } else {
        menu.appendChild(createDropdownMenuItem(itemConfig));
      }
    });
  }

  return attachDropdownMenu(trigger, menu, {
    align: options.align,
    side: options.side,
    onOpenChange: options.onOpenChange
  });
}

// Dropdown menu icons (reuse ContextMenuIcons)
const DropdownMenuIcons = ContextMenuIcons;

// ===== Input Component (Vanilla JS) =====
(function () {
  /**
   * Create a base input element with accessible defaults.
   * @param {Object} options
   * @param {string} [options.type='text'] - Input type
   * @param {string} [options.placeholder] - Placeholder text
   * @param {string|number} [options.value] - Initial value
   * @param {boolean} [options.disabled=false] - Disabled state
   * @param {string} [options.className] - Extra CSS classes
   * @param {string} [options.id] - Element id
   * @param {string} [options.name] - Input name
   * @param {boolean} [options.required=false] - Required flag
   * @param {RegExp|string} [options.pattern] - Validation pattern
   * @param {number} [options.minLength] - Min length
   * @param {number} [options.maxLength] - Max length
   * @param {string} [options.ariaLabel] - ARIA label
   * @param {Function} [options.onInput] - Input event handler
   * @param {Function} [options.onChange] - Change event handler
   * @param {Function} [options.onFocus] - Focus event handler
   * @param {Function} [options.onBlur] - Blur event handler
   * @returns {HTMLInputElement}
   */
  function createInput(options = {}) {
    const {
      type = 'text',
      placeholder = '',
      value = '',
      disabled = false,
      className = '',
      id,
      name,
      required = false,
      pattern,
      minLength,
      maxLength,
      ariaLabel,
      onInput,
      onChange,
      onFocus,
      onBlur,
    } = options;

    const el = document.createElement('input');
    el.type = type;
    el.className = `input${className ? ' ' + className : ''}`;

    if (id) el.id = id;
    if (name) el.name = name;
    if (placeholder) el.placeholder = placeholder;
    if (ariaLabel) el.setAttribute('aria-label', ariaLabel);
    if (required) el.required = true;

    if (pattern instanceof RegExp) {
      el.pattern = pattern.source;
    } else if (typeof pattern === 'string') {
      el.pattern = pattern;
    }
    if (typeof minLength === 'number') el.minLength = minLength;
    if (typeof maxLength === 'number') el.maxLength = maxLength;

    if (value !== undefined && value !== null) el.value = String(value);
    if (disabled) {
      el.disabled = true;
      el.setAttribute('aria-disabled', 'true');
    }

    // Accessible default
    el.setAttribute('aria-invalid', 'false');

    // Event handlers
    if (typeof onInput === 'function') el.addEventListener('input', (e) => onInput(e, el.value));
    if (typeof onChange === 'function') el.addEventListener('change', (e) => onChange(e, el.value));
    if (typeof onFocus === 'function') el.addEventListener('focus', onFocus);
    if (typeof onBlur === 'function') el.addEventListener('blur', onBlur);

    // Convenience API
    el.setValue = (v) => { el.value = v ?? ''; };
    el.getValue = () => el.value;
    el.enable = () => { el.disabled = false; el.removeAttribute('aria-disabled'); };
    el.disable = () => { el.disabled = true; el.setAttribute('aria-disabled', 'true'); };
    el.setInvalid = (invalid, describedById) => {
      el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      if (describedById) el.setAttribute('aria-describedby', describedById);
      else el.removeAttribute('aria-describedby');
    };

    return el;
  }

  // Expose globally
  window.createInput = window.createInput || createInput;
})();

// ===== Label Component (Vanilla JS) =====
(function () {
  /**
   * Create a label element mirroring shadcn/ui defaults.
   * @param {Object} options
   * @param {string} [options.text] - Label text
   * @param {string} [options.htmlFor] - Associated control id
   * @param {string} [options.className] - Extra CSS classes
   * @param {boolean} [options.disabled=false] - Disabled visual state
   * @param {string} [options.id] - Element id
   * @returns {HTMLLabelElement}
   */
  function createLabel(options = {}) {
    const { text = '', htmlFor, className = '', disabled = false, id } = options;
    const el = document.createElement('label');
    el.className = `label${className ? ' ' + className : ''}`;
    if (id) el.id = id;
    if (htmlFor) el.setAttribute('for', htmlFor);
    el.textContent = text;
    if (disabled) el.setAttribute('aria-disabled', 'true');
    return el;
  }

  // Expose globally
  window.createLabel = window.createLabel || createLabel;
})();

// ===== Menubar Component (Vanilla JS) =====
(function () {
  let activeMenubar = null;
  let activeMenu = null;

  /**
   * Create menubar root container
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @param {string} [options.id] - Element id
   * @returns {HTMLElement}
   */
  function createMenubar(options = {}) {
    const { className = '', id } = options;
    const el = document.createElement('div');
    el.className = `menubar${className ? ' ' + className : ''}`;
    if (id) el.id = id;
    el.setAttribute('role', 'menubar');
    el._menus = [];
    return el;
  }

  /**
   * Create menubar trigger
   * @param {Object} options
   * @param {string} [options.label] - Trigger text
   * @param {string} [options.className] - Extra CSS classes
   * @param {HTMLElement} [options.content] - Menu content to attach
   * @returns {HTMLElement}
   */
  function createMenubarTrigger(options = {}) {
    const { label = '', className = '' } = options;
    const el = document.createElement('button');
    el.className = `menubar-trigger${className ? ' ' + className : ''}`;
    el.setAttribute('role', 'menuitem');
    el.setAttribute('aria-haspopup', 'true');
    el.setAttribute('aria-expanded', 'false');
    el.setAttribute('data-state', 'closed');
    el.textContent = label;
    el.type = 'button';
    return el;
  }

  /**
   * Create menubar content container
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @param {number} [options.alignOffset=-4] - Horizontal offset
   * @param {number} [options.sideOffset=8] - Vertical offset
   * @returns {HTMLElement}
   */
  function createMenubarContent(options = {}) {
    const { className = '', alignOffset = -4, sideOffset = 8 } = options;
    const el = document.createElement('div');
    el.className = `menubar-content${className ? ' ' + className : ''}`;
    el.setAttribute('role', 'menu');
    el.setAttribute('data-state', 'closed');
    el._alignOffset = alignOffset;
    el._sideOffset = sideOffset;
    return el;
  }

  /**
   * Create menubar item
   * @param {Object} options
   * @param {string} [options.label] - Item text
   * @param {boolean} [options.inset=false] - Add left padding
   * @param {boolean} [options.disabled=false] - Disabled state
   * @param {string} [options.className] - Extra CSS classes
   * @param {Function} [options.onClick] - Click handler
   * @returns {HTMLElement}
   */
  function createMenubarItem(options = {}) {
    const { label = '', inset = false, disabled = false, className = '', onClick } = options;
    const el = document.createElement('div');
    el.className = `menubar-item${inset ? ' inset' : ''}${className ? ' ' + className : ''}`;
    el.setAttribute('role', 'menuitem');
    el.setAttribute('tabindex', '-1');
    el.textContent = label;
    if (disabled) el.setAttribute('data-disabled', 'true');
    if (typeof onClick === 'function') el.addEventListener('click', onClick);
    return el;
  }

  /**
   * Create menubar checkbox item
   * @param {Object} options
   * @param {string} [options.label] - Item text
   * @param {boolean} [options.checked=false] - Checked state
   * @param {boolean} [options.disabled=false] - Disabled state
   * @param {string} [options.className] - Extra CSS classes
   * @param {Function} [options.onCheckedChange] - Checked state change handler
   * @returns {HTMLElement}
   */
  function createMenubarCheckboxItem(options = {}) {
    const { label = '', checked = false, disabled = false, className = '', onCheckedChange } = options;
    const el = document.createElement('div');
    el.className = `menubar-checkbox-item${className ? ' ' + className : ''}`;
    el.setAttribute('role', 'menuitemcheckbox');
    el.setAttribute('aria-checked', checked ? 'true' : 'false');
    el.setAttribute('tabindex', '-1');
    if (disabled) el.setAttribute('data-disabled', 'true');

    const indicator = document.createElement('span');
    indicator.className = 'menubar-item-indicator';
    indicator.innerHTML = checked ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' : '';
    el.appendChild(indicator);

    const text = document.createElement('span');
    text.textContent = label;
    el.appendChild(text);

    el.addEventListener('click', () => {
      if (disabled) return;
      const newChecked = el.getAttribute('aria-checked') === 'false';
      el.setAttribute('aria-checked', newChecked ? 'true' : 'false');
      indicator.innerHTML = newChecked ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' : '';
      if (typeof onCheckedChange === 'function') onCheckedChange(newChecked);
    });

    return el;
  }

  /**
   * Create menubar radio item
   * @param {Object} options
   * @param {string} [options.label] - Item text
   * @param {string} [options.value] - Radio value
   * @param {boolean} [options.checked=false] - Checked state
   * @param {boolean} [options.disabled=false] - Disabled state
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLElement}
   */
  function createMenubarRadioItem(options = {}) {
    const { label = '', value = '', checked = false, disabled = false, className = '' } = options;
    const el = document.createElement('div');
    el.className = `menubar-radio-item${className ? ' ' + className : ''}`;
    el.setAttribute('role', 'menuitemradio');
    el.setAttribute('aria-checked', checked ? 'true' : 'false');
    el.setAttribute('tabindex', '-1');
    el.dataset.value = value;
    if (disabled) el.setAttribute('data-disabled', 'true');

    const indicator = document.createElement('span');
    indicator.className = 'menubar-item-indicator';
    indicator.innerHTML = checked ? '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>' : '';
    el.appendChild(indicator);

    const text = document.createElement('span');
    text.textContent = label;
    el.appendChild(text);

    return el;
  }

  /**
   * Create menubar separator
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLElement}
   */
  function createMenubarSeparator(options = {}) {
    const { className = '' } = options;
    const el = document.createElement('div');
    el.className = `menubar-separator${className ? ' ' + className : ''}`;
    el.setAttribute('role', 'separator');
    return el;
  }

  /**
   * Create menubar label
   * @param {Object} options
   * @param {string} [options.text] - Label text
   * @param {boolean} [options.inset=false] - Add left padding
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLElement}
   */
  function createMenubarLabel(options = {}) {
    const { text = '', inset = false, className = '' } = options;
    const el = document.createElement('div');
    el.className = `menubar-label${inset ? ' inset' : ''}${className ? ' ' + className : ''}`;
    el.textContent = text;
    return el;
  }

  /**
   * Create menubar shortcut
   * @param {Object} options
   * @param {string} [options.text] - Shortcut text
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLElement}
   */
  function createMenubarShortcut(options = {}) {
    const { text = '', className = '' } = options;
    const el = document.createElement('span');
    el.className = `menubar-shortcut${className ? ' ' + className : ''}`;
    el.textContent = text;
    return el;
  }

  /**
   * Create menubar submenu trigger
   * @param {Object} options
   * @param {string} [options.label] - Trigger text
   * @param {boolean} [options.inset=false] - Add left padding
   * @param {boolean} [options.disabled=false] - Disabled state
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLElement}
   */
  function createMenubarSubTrigger(options = {}) {
    const { label = '', inset = false, disabled = false, className = '' } = options;
    const el = document.createElement('div');
    el.className = `menubar-subtrigger${inset ? ' inset' : ''}${className ? ' ' + className : ''}`;
    el.setAttribute('role', 'menuitem');
    el.setAttribute('aria-haspopup', 'true');
    el.setAttribute('data-state', 'closed');
    el.setAttribute('tabindex', '-1');
    if (disabled) el.setAttribute('data-disabled', 'true');

    const text = document.createElement('span');
    text.textContent = label;
    el.appendChild(text);

    const icon = document.createElement('svg');
    icon.className = 'menubar-subtrigger-icon';
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.innerHTML = '<polyline points="9 18 15 12 9 6"/>';
    el.appendChild(icon);

    return el;
  }

  /**
   * Create menubar submenu content
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLElement}
   */
  function createMenubarSubContent(options = {}) {
    const { className = '' } = options;
    const el = document.createElement('div');
    el.className = `menubar-subcontent${className ? ' ' + className : ''}`;
    el.setAttribute('role', 'menu');
    el.setAttribute('data-state', 'closed');
    return el;
  }

  /**
   * Attach menubar menu to trigger
   * @param {HTMLElement} menubar - Menubar container
   * @param {HTMLElement} trigger - Menu trigger
   * @param {HTMLElement} content - Menu content
   * @param {Object} options
   * @param {Function} [options.onOpenChange] - Open state callback
   * @returns {Object} Control functions
   */
  function attachMenubarMenu(menubar, trigger, content, options = {}) {
    const { onOpenChange } = options;
    let isOpen = false;
    let submenuTimeout = null;
    let activeSubmenu = null;

    menubar._menus.push({ trigger, content, isOpen: () => isOpen });

    // Position content
    const position = () => {
      const triggerRect = trigger.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const alignOffset = content._alignOffset || -4;
      const sideOffset = content._sideOffset || 8;

      let x = triggerRect.left + alignOffset;
      let y = triggerRect.bottom + sideOffset;

      // Boundary checks
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (x + contentRect.width > vw) x = vw - contentRect.width - 8;
      if (x < 0) x = 8;
      if (y + contentRect.height > vh) y = triggerRect.top - contentRect.height - sideOffset;
      if (y < 0) y = 8;

      content.style.left = `${Math.round(x)}px`;
      content.style.top = `${Math.round(y)}px`;
    };

    // Position submenu
    const positionSubmenu = (subTrigger, submenu) => {
      const triggerRect = subTrigger.getBoundingClientRect();
      const submenuRect = submenu.getBoundingClientRect();

      let x = triggerRect.right;
      let y = triggerRect.top;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (x + submenuRect.width > vw) x = triggerRect.left - submenuRect.width;
      if (y + submenuRect.height > vh) y = vh - submenuRect.height - 8;

      submenu.style.left = `${Math.round(x)}px`;
      submenu.style.top = `${Math.round(y)}px`;
    };

    // Close submenus
    const closeSubmenus = () => {
      if (activeSubmenu) {
        activeSubmenu.setAttribute('data-state', 'closed');
        activeSubmenu.style.display = 'none';
        const subTriggers = content.querySelectorAll('.menubar-subtrigger');
        subTriggers.forEach(t => t.setAttribute('data-state', 'closed'));
        activeSubmenu = null;
      }
    };

    // Open menu
    const open = () => {
      // Close other menus in this menubar
      menubar._menus.forEach(m => {
        if (m.trigger !== trigger && m.isOpen()) {
          closeMenu(m.trigger, m.content);
        }
      });

      isOpen = true;
      trigger.setAttribute('data-state', 'open');
      trigger.setAttribute('aria-expanded', 'true');
      content.setAttribute('data-state', 'open');
      content.style.display = 'block';
      document.body.appendChild(content);
      position();
      activeMenubar = menubar;
      activeMenu = content;

      if (typeof onOpenChange === 'function') onOpenChange(true);

      setTimeout(() => {
        const firstItem = content.querySelector('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]');
        if (firstItem) firstItem.focus();
      }, 50);
    };

    // Close menu
    const close = () => {
      isOpen = false;
      trigger.setAttribute('data-state', 'closed');
      trigger.setAttribute('aria-expanded', 'false');
      content.setAttribute('data-state', 'closed');
      closeSubmenus();
      setTimeout(() => {
        content.style.display = 'none';
      }, 100);

      if (activeMenu === content) {
        activeMenu = null;
        activeMenubar = null;
      }

      if (typeof onOpenChange === 'function') onOpenChange(false);
    };

    // Toggle
    const toggle = () => {
      if (isOpen) close();
      else open();
    };

    // Trigger click
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    // Trigger hover (open on hover if another menu is already open)
    trigger.addEventListener('mouseenter', () => {
      if (activeMenubar === menubar && activeMenu && activeMenu !== content) {
        open();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (isOpen && !content.contains(e.target) && !trigger.contains(e.target)) {
        close();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        close();
        trigger.focus();
      }
    });

    // Close when item clicked
    content.addEventListener('click', (e) => {
      const item = e.target.closest('.menubar-item');
      if (item && !item.hasAttribute('data-disabled')) {
        close();
      }
    });

    // Handle submenus
    content.addEventListener('mouseenter', (e) => {
      const subTrigger = e.target.closest('.menubar-subtrigger');
      if (subTrigger && !subTrigger.hasAttribute('data-disabled')) {
        clearTimeout(submenuTimeout);
        submenuTimeout = setTimeout(() => {
          closeSubmenus();
          const submenu = subTrigger._submenuContent;
          if (submenu) {
            subTrigger.setAttribute('data-state', 'open');
            submenu.setAttribute('data-state', 'open');
            submenu.style.display = 'block';
            document.body.appendChild(submenu);
            positionSubmenu(subTrigger, submenu);
            activeSubmenu = submenu;
          }
        }, 200);
      }
    }, true);

    content.addEventListener('mouseleave', (e) => {
      const subTrigger = e.target.closest('.menubar-subtrigger');
      if (subTrigger) clearTimeout(submenuTimeout);
    }, true);

    // Keyboard navigation
    content.addEventListener('keydown', (e) => {
      const items = Array.from(content.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'))
        .filter(item => !item.hasAttribute('data-disabled'));
      const currentIndex = items.indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        items[prevIndex].focus();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const subTrigger = document.activeElement?.closest('.menubar-subtrigger');
        if (subTrigger && subTrigger._submenuContent) {
          const submenu = subTrigger._submenuContent;
          closeSubmenus();
          subTrigger.setAttribute('data-state', 'open');
          submenu.setAttribute('data-state', 'open');
          submenu.style.display = 'block';
          document.body.appendChild(submenu);
          positionSubmenu(subTrigger, submenu);
          activeSubmenu = submenu;
          const firstItem = submenu.querySelector('[role="menuitem"]');
          if (firstItem) firstItem.focus();
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (currentIndex >= 0) items[currentIndex].click();
      }
    });

    // Radio group handling
    content.addEventListener('click', (e) => {
      const radioItem = e.target.closest('.menubar-radio-item');
      if (radioItem && !radioItem.hasAttribute('data-disabled')) {
        const group = radioItem.closest('.menubar-content, .menubar-subcontent');
        const radios = group.querySelectorAll('.menubar-radio-item');
        radios.forEach(r => {
          r.setAttribute('aria-checked', 'false');
          r.querySelector('.menubar-item-indicator').innerHTML = '';
        });
        radioItem.setAttribute('aria-checked', 'true');
        radioItem.querySelector('.menubar-item-indicator').innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>';
      }
    });

    return { open, close, toggle, isOpen: () => isOpen };
  }

  /**
   * Helper to close a menu
   */
  function closeMenu(trigger, content) {
    trigger.setAttribute('data-state', 'closed');
    trigger.setAttribute('aria-expanded', 'false');
    content.setAttribute('data-state', 'closed');
    setTimeout(() => content.style.display = 'none', 100);
  }

  // Expose
  window.createMenubar = window.createMenubar || createMenubar;
  window.createMenubarTrigger = window.createMenubarTrigger || createMenubarTrigger;
  window.createMenubarContent = window.createMenubarContent || createMenubarContent;
  window.createMenubarItem = window.createMenubarItem || createMenubarItem;
  window.createMenubarCheckboxItem = window.createMenubarCheckboxItem || createMenubarCheckboxItem;
  window.createMenubarRadioItem = window.createMenubarRadioItem || createMenubarRadioItem;
  window.createMenubarSeparator = window.createMenubarSeparator || createMenubarSeparator;
  window.createMenubarLabel = window.createMenubarLabel || createMenubarLabel;
  window.createMenubarShortcut = window.createMenubarShortcut || createMenubarShortcut;
  window.createMenubarSubTrigger = window.createMenubarSubTrigger || createMenubarSubTrigger;
  window.createMenubarSubContent = window.createMenubarSubContent || createMenubarSubContent;
  window.attachMenubarMenu = window.attachMenubarMenu || attachMenubarMenu;
})();

// ===== Initialize Menubar Demo =====
(function initMenubarDemo() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMenubarDemo);
  } else {
    setupMenubarDemo();
  }

  function setupMenubarDemo() {
    const container = document.getElementById('menubarDemo');
    if (!container) return;

    // Create menubar
    const menubar = createMenubar();

    // ===== File Menu =====
    const fileTrigger = createMenubarTrigger({ label: 'File' });
    const fileContent = createMenubarContent();

    // New File item with shortcut
    const newFileItem = createMenubarItem({ 
      label: 'New File',
      onClick: () => showNotification('New File clicked')
    });
    const newFileShortcut = createMenubarShortcut({ text: '⌘N' });
    newFileItem.appendChild(newFileShortcut);
    fileContent.appendChild(newFileItem);

    // Open item with shortcut
    const openItem = createMenubarItem({ 
      label: 'Open...',
      onClick: () => showNotification('Open clicked')
    });
    const openShortcut = createMenubarShortcut({ text: '⌘O' });
    openItem.appendChild(openShortcut);
    fileContent.appendChild(openItem);

    // Open Recent submenu
    const openRecentTrigger = createMenubarSubTrigger({ label: 'Open Recent' });
    const openRecentContent = createMenubarSubContent();
    openRecentContent.appendChild(createMenubarItem({ 
      label: 'dashboard.html',
      onClick: () => showNotification('Opening dashboard.html')
    }));
    openRecentContent.appendChild(createMenubarItem({ 
      label: 'dashboard.js',
      onClick: () => showNotification('Opening dashboard.js')
    }));
    openRecentContent.appendChild(createMenubarSeparator());
    openRecentContent.appendChild(createMenubarItem({ 
      label: 'Clear Recent',
      onClick: () => showNotification('Recent files cleared')
    }));
    openRecentTrigger._submenuContent = openRecentContent;
    fileContent.appendChild(openRecentTrigger);

    fileContent.appendChild(createMenubarSeparator());

    // Save item with shortcut
    const saveItem = createMenubarItem({ 
      label: 'Save',
      onClick: () => showNotification('File saved')
    });
    const saveShortcut = createMenubarShortcut({ text: '⌘S' });
    saveItem.appendChild(saveShortcut);
    fileContent.appendChild(saveItem);

    // Save As
    fileContent.appendChild(createMenubarItem({ 
      label: 'Save As...',
      onClick: () => showNotification('Save As clicked')
    }));

    fileContent.appendChild(createMenubarSeparator());

    // Exit
    fileContent.appendChild(createMenubarItem({ 
      label: 'Exit',
      onClick: () => showNotification('Exit clicked')
    }));

    menubar.appendChild(fileTrigger);
    attachMenubarMenu(menubar, fileTrigger, fileContent);

    // ===== Edit Menu =====
    const editTrigger = createMenubarTrigger({ label: 'Edit' });
    const editContent = createMenubarContent();

    // Undo/Redo with shortcuts
    const undoItem = createMenubarItem({ 
      label: 'Undo',
      onClick: () => showNotification('Undo')
    });
    undoItem.appendChild(createMenubarShortcut({ text: '⌘Z' }));
    editContent.appendChild(undoItem);

    const redoItem = createMenubarItem({ 
      label: 'Redo',
      onClick: () => showNotification('Redo')
    });
    redoItem.appendChild(createMenubarShortcut({ text: '⌘⇧Z' }));
    editContent.appendChild(redoItem);

    editContent.appendChild(createMenubarSeparator());

    // Cut/Copy/Paste
    const cutItem = createMenubarItem({ label: 'Cut', onClick: () => showNotification('Cut') });
    cutItem.appendChild(createMenubarShortcut({ text: '⌘X' }));
    editContent.appendChild(cutItem);

    const copyItem = createMenubarItem({ label: 'Copy', onClick: () => showNotification('Copy') });
    copyItem.appendChild(createMenubarShortcut({ text: '⌘C' }));
    editContent.appendChild(copyItem);

    const pasteItem = createMenubarItem({ label: 'Paste', onClick: () => showNotification('Paste') });
    pasteItem.appendChild(createMenubarShortcut({ text: '⌘V' }));
    editContent.appendChild(pasteItem);

    editContent.appendChild(createMenubarSeparator());

    // Checkboxes
    editContent.appendChild(createMenubarLabel({ text: 'Options' }));
    editContent.appendChild(createMenubarCheckboxItem({ 
      label: 'Line Numbers', 
      checked: true,
      onCheckedChange: (checked) => showNotification(`Line Numbers: ${checked ? 'ON' : 'OFF'}`)
    }));
    editContent.appendChild(createMenubarCheckboxItem({ 
      label: 'Word Wrap',
      checked: false,
      onCheckedChange: (checked) => showNotification(`Word Wrap: ${checked ? 'ON' : 'OFF'}`)
    }));
    editContent.appendChild(createMenubarCheckboxItem({ 
      label: 'Minimap',
      checked: true,
      onCheckedChange: (checked) => showNotification(`Minimap: ${checked ? 'ON' : 'OFF'}`)
    }));

    menubar.appendChild(editTrigger);
    attachMenubarMenu(menubar, editTrigger, editContent);

    // ===== View Menu =====
    const viewTrigger = createMenubarTrigger({ label: 'View' });
    const viewContent = createMenubarContent();

    // Appearance section with radio group
    viewContent.appendChild(createMenubarLabel({ text: 'Appearance' }));
    viewContent.appendChild(createMenubarRadioItem({ 
      label: 'Light Theme', 
      value: 'light',
      checked: !document.body.classList.contains('dark')
    }));
    viewContent.appendChild(createMenubarRadioItem({ 
      label: 'Dark Theme', 
      value: 'dark',
      checked: document.body.classList.contains('dark')
    }));
    viewContent.appendChild(createMenubarRadioItem({ 
      label: 'System Theme', 
      value: 'system'
    }));

    viewContent.appendChild(createMenubarSeparator());

    // Layout section
    viewContent.appendChild(createMenubarLabel({ text: 'Layout' }));
    viewContent.appendChild(createMenubarItem({ 
      label: 'Toggle Sidebar',
      onClick: () => showNotification('Sidebar toggled')
    }));
    viewContent.appendChild(createMenubarItem({ 
      label: 'Toggle Panel',
      onClick: () => showNotification('Panel toggled')
    }));

    viewContent.appendChild(createMenubarSeparator());

    // Zoom submenu
    const zoomTrigger = createMenubarSubTrigger({ label: 'Zoom' });
    const zoomContent = createMenubarSubContent();
    const zoomInItem = createMenubarItem({ 
      label: 'Zoom In',
      onClick: () => showNotification('Zoom In')
    });
    zoomInItem.appendChild(createMenubarShortcut({ text: '⌘+' }));
    zoomContent.appendChild(zoomInItem);

    const zoomOutItem = createMenubarItem({ 
      label: 'Zoom Out',
      onClick: () => showNotification('Zoom Out')
    });
    zoomOutItem.appendChild(createMenubarShortcut({ text: '⌘-' }));
    zoomContent.appendChild(zoomOutItem);

    const zoomResetItem = createMenubarItem({ 
      label: 'Reset Zoom',
      onClick: () => showNotification('Zoom Reset')
    });
    zoomResetItem.appendChild(createMenubarShortcut({ text: '⌘0' }));
    zoomContent.appendChild(zoomResetItem);

    zoomTrigger._submenuContent = zoomContent;
    viewContent.appendChild(zoomTrigger);

    menubar.appendChild(viewTrigger);
    attachMenubarMenu(menubar, viewTrigger, viewContent);

    // ===== Help Menu =====
    const helpTrigger = createMenubarTrigger({ label: 'Help' });
    const helpContent = createMenubarContent();

    helpContent.appendChild(createMenubarItem({ 
      label: 'Documentation',
      onClick: () => showNotification('Opening documentation...')
    }));
    helpContent.appendChild(createMenubarItem({ 
      label: 'Keyboard Shortcuts',
      onClick: () => showNotification('Showing shortcuts...')
    }));
    helpContent.appendChild(createMenubarSeparator());
    helpContent.appendChild(createMenubarItem({ 
      label: 'About',
      onClick: () => showNotification('Voice Platform v1.0.0')
    }));

    menubar.appendChild(helpTrigger);
    attachMenubarMenu(menubar, helpTrigger, helpContent);

    // Add to container
    container.appendChild(menubar);

    // Helper to show notifications
    function showNotification(message) {
      // Create a simple toast notification
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideIn 0.2s ease-out;
        font-size: 14px;
        color: var(--text-primary);
      `;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'slideOut 0.2s ease-in';
        setTimeout(() => toast.remove(), 200);
      }, 2000);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    // Update theme radio when theme button is clicked
    const originalToggleTheme = window.toggleTheme;
    if (typeof originalToggleTheme === 'function') {
      window.toggleTheme = function() {
        originalToggleTheme();
        setTimeout(() => {
          const isDark = document.body.classList.contains('dark');
          const radios = viewContent.querySelectorAll('.menubar-radio-item');
          radios.forEach(r => {
            const value = r.dataset.value;
            const checked = (isDark && value === 'dark') || (!isDark && value === 'light');
            r.setAttribute('aria-checked', checked ? 'true' : 'false');
            r.querySelector('.menubar-item-indicator').innerHTML = checked 
              ? '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>' 
              : '';
          });
        }, 50);
      };
    }
  }
})();

// ===== NavigationMenu Component (Vanilla JS) =====
(function () {
  /**
   * Create navigation menu root
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @param {string} [options.id] - Element id
   * @returns {HTMLElement}
   */
  function createNavigationMenu(options = {}) {
    const { className = '', id } = options;
    const el = document.createElement('nav');
    el.className = `navigation-menu${className ? ' ' + className : ''}`;
    if (id) el.id = id;
    el.setAttribute('role', 'navigation');
    el._items = [];
    el._viewport = null;
    el._indicator = null;
    el._activeItem = null;
    return el;
  }

  /**
   * Create navigation menu list
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLElement}
   */
  function createNavigationMenuList(options = {}) {
    const { className = '' } = options;
    const el = document.createElement('ul');
    el.className = `navigation-menu-list${className ? ' ' + className : ''}`;
    return el;
  }

  /**
   * Create navigation menu item
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @param {string} [options.value] - Item identifier
   * @returns {HTMLElement}
   */
  function createNavigationMenuItem(options = {}) {
    const { className = '', value = '' } = options;
    const el = document.createElement('li');
    el.className = `navigation-menu-item${className ? ' ' + className : ''}`;
    if (value) el.dataset.value = value;
    return el;
  }

  /**
   * Create navigation menu trigger
   * @param {Object} options
   * @param {string} [options.label] - Trigger text
   * @param {boolean} [options.disabled=false] - Disabled state
   * @param {string} [options.className] - Extra CSS classes
   * @param {boolean} [options.showChevron=true] - Show chevron icon
   * @returns {HTMLButtonElement}
   */
  function createNavigationMenuTrigger(options = {}) {
    const { label = '', disabled = false, className = '', showChevron = true } = options;
    const el = document.createElement('button');
    el.className = `navigation-menu-trigger${className ? ' ' + className : ''}`;
    el.type = 'button';
    el.setAttribute('data-state', 'closed');
    el.textContent = label + ' ';
    if (disabled) el.disabled = true;

    if (showChevron) {
      const icon = document.createElement('svg');
      icon.className = 'navigation-menu-trigger-icon';
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('fill', 'none');
      icon.setAttribute('stroke', 'currentColor');
      icon.setAttribute('stroke-width', '2');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<polyline points="6 9 12 15 18 9"/>';
      el.appendChild(icon);
    }

    return el;
  }

  /**
   * Create navigation menu content
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLElement}
   */
  function createNavigationMenuContent(options = {}) {
    const { className = '' } = options;
    const el = document.createElement('div');
    el.className = `navigation-menu-content${className ? ' ' + className : ''}`;
    el.setAttribute('data-state', 'closed');
    el.style.display = 'none';
    return el;
  }

  /**
   * Create navigation menu link
   * @param {Object} options
   * @param {string} [options.href] - Link URL
   * @param {string} [options.label] - Link text
   * @param {string} [options.className] - Extra CSS classes
   * @param {Function} [options.onClick] - Click handler
   * @returns {HTMLAnchorElement}
   */
  function createNavigationMenuLink(options = {}) {
    const { href = '#', label = '', className = '', onClick } = options;
    const el = document.createElement('a');
    el.className = `navigation-menu-link${className ? ' ' + className : ''}`;
    el.href = href;
    el.textContent = label;
    if (typeof onClick === 'function') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        onClick(e);
      });
    }
    return el;
  }

  /**
   * Create navigation menu viewport
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLElement}
   */
  function createNavigationMenuViewport(options = {}) {
    const { className = '' } = options;
    const wrapper = document.createElement('div');
    wrapper.className = 'navigation-menu-viewport-wrapper';

    const el = document.createElement('div');
    el.className = `navigation-menu-viewport${className ? ' ' + className : ''}`;
    el.setAttribute('data-state', 'closed');
    el.style.width = '0px';
    el.style.height = '0px';

    wrapper.appendChild(el);
    return wrapper;
  }

  /**
   * Create navigation menu indicator
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLElement}
   */
  function createNavigationMenuIndicator(options = {}) {
    const { className = '' } = options;
    const el = document.createElement('div');
    el.className = `navigation-menu-indicator${className ? ' ' + className : ''}`;
    el.setAttribute('data-state', 'hidden');

    const arrow = document.createElement('div');
    arrow.className = 'navigation-menu-indicator-arrow';
    el.appendChild(arrow);

    return el;
  }

  /**
   * Attach navigation menu functionality
   * @param {HTMLElement} nav - Navigation menu root
   * @param {Object} options
   * @param {Function} [options.onValueChange] - Value change callback
   * @returns {Object} Control functions
   */
  function attachNavigationMenu(nav, options = {}) {
    const { onValueChange } = options;
    
    const list = nav.querySelector('.navigation-menu-list');
    if (!list) return {};

    // Get or create viewport
    let viewportWrapper = nav.querySelector('.navigation-menu-viewport-wrapper');
    if (!viewportWrapper) {
      viewportWrapper = createNavigationMenuViewport();
      nav.appendChild(viewportWrapper);
    }
    const viewport = viewportWrapper.querySelector('.navigation-menu-viewport');
    nav._viewport = viewport;

    // Get or create indicator
    let indicator = nav.querySelector('.navigation-menu-indicator');
    if (!indicator) {
      indicator = createNavigationMenuIndicator();
      list.appendChild(indicator);
    }
    nav._indicator = indicator;

    // Setup each item
    const items = list.querySelectorAll('.navigation-menu-item');
    items.forEach((item, index) => {
      const trigger = item.querySelector('.navigation-menu-trigger');
      const content = item.querySelector('.navigation-menu-content');
      
      if (!trigger) return;

      nav._items.push({ item, trigger, content, index });

      // Click trigger
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (nav._activeItem === item) {
          closeContent();
        } else {
          openContent(item, trigger, content);
        }
      });

      // Hover trigger
      trigger.addEventListener('mouseenter', () => {
        if (nav._activeItem && nav._activeItem !== item) {
          openContent(item, trigger, content);
        }
      });

      // Focus trigger
      trigger.addEventListener('focus', () => {
        updateIndicator(trigger);
      });
    });

    // Open content
    function openContent(item, trigger, content) {
      // Close previous
      if (nav._activeItem && nav._activeItem !== item) {
        const prevTrigger = nav._activeItem.querySelector('.navigation-menu-trigger');
        const prevContent = nav._activeItem.querySelector('.navigation-menu-content');
        if (prevTrigger) {
          prevTrigger.setAttribute('data-state', 'closed');
          prevTrigger.setAttribute('data-active', 'false');
        }
        if (prevContent) {
          prevContent.setAttribute('data-state', 'closed');
          setTimeout(() => {
            prevContent.style.display = 'none';
          }, 150);
        }
      }

      // Open new
      nav._activeItem = item;
      trigger.setAttribute('data-state', 'open');
      trigger.setAttribute('data-active', 'true');
      
      if (content) {
        // Determine motion direction
        const prevIndex = nav._items.findIndex(i => i.item === nav._activeItem);
        const currentIndex = nav._items.findIndex(i => i.item === item);
        let motion = '';
        if (prevIndex >= 0 && currentIndex >= 0) {
          motion = currentIndex > prevIndex ? 'from-end' : 'from-start';
        }
        
        content.setAttribute('data-state', 'open');
        content.setAttribute('data-motion', motion);
        content.style.display = 'block';

        // Update viewport
        setTimeout(() => {
          updateViewport(content);
        }, 0);
      }

      updateIndicator(trigger);

      if (typeof onValueChange === 'function') {
        onValueChange(item.dataset.value || '');
      }
    }

    // Close content
    function closeContent() {
      if (!nav._activeItem) return;

      const trigger = nav._activeItem.querySelector('.navigation-menu-trigger');
      const content = nav._activeItem.querySelector('.navigation-menu-content');

      if (trigger) {
        trigger.setAttribute('data-state', 'closed');
        trigger.setAttribute('data-active', 'false');
      }
      if (content) {
        content.setAttribute('data-state', 'closed');
        setTimeout(() => {
          content.style.display = 'none';
        }, 150);
      }

      viewport.setAttribute('data-state', 'closed');
      setTimeout(() => {
        viewport.style.width = '0px';
        viewport.style.height = '0px';
      }, 200);

      indicator.setAttribute('data-state', 'hidden');
      nav._activeItem = null;

      if (typeof onValueChange === 'function') {
        onValueChange('');
      }
    }

    // Update viewport size
    function updateViewport(content) {
      if (!content) return;

      viewport.setAttribute('data-state', 'open');
      
      // Measure content
      const rect = content.getBoundingClientRect();
      viewport.style.width = `${rect.width}px`;
      viewport.style.height = `${rect.height}px`;

      // Position content in viewport
      viewport.innerHTML = '';
      viewport.appendChild(content.cloneNode(true));
      const clonedContent = viewport.firstChild;
      clonedContent.style.display = 'block';
      clonedContent.setAttribute('data-state', 'open');
      clonedContent.setAttribute('data-motion', '');
    }

    // Update indicator position
    function updateIndicator(trigger) {
      if (!trigger) return;

      const listRect = list.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();

      const left = triggerRect.left - listRect.left;
      const width = triggerRect.width;

      indicator.style.left = `${left}px`;
      indicator.style.width = `${width}px`;
      indicator.setAttribute('data-state', 'visible');
    }

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && nav._activeItem) {
        closeContent();
      }
    });

    // Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav._activeItem) {
        closeContent();
        const trigger = nav._activeItem.querySelector('.navigation-menu-trigger');
        if (trigger) trigger.focus();
      }
    });

    // Mouse leave
    nav.addEventListener('mouseleave', () => {
      if (nav._activeItem) {
        setTimeout(() => {
          if (!nav.matches(':hover')) {
            closeContent();
          }
        }, 100);
      }
    });

    return {
      open: (value) => {
        const itemData = nav._items.find(i => i.item.dataset.value === value);
        if (itemData) {
          openContent(itemData.item, itemData.trigger, itemData.content);
        }
      },
      close: closeContent,
      getValue: () => nav._activeItem?.dataset.value || ''
    };
  }

  // Expose
  window.createNavigationMenu = window.createNavigationMenu || createNavigationMenu;
  window.createNavigationMenuList = window.createNavigationMenuList || createNavigationMenuList;
  window.createNavigationMenuItem = window.createNavigationMenuItem || createNavigationMenuItem;
  window.createNavigationMenuTrigger = window.createNavigationMenuTrigger || createNavigationMenuTrigger;
  window.createNavigationMenuContent = window.createNavigationMenuContent || createNavigationMenuContent;
  window.createNavigationMenuLink = window.createNavigationMenuLink || createNavigationMenuLink;
  window.createNavigationMenuViewport = window.createNavigationMenuViewport || createNavigationMenuViewport;
  window.createNavigationMenuIndicator = window.createNavigationMenuIndicator || createNavigationMenuIndicator;
  window.attachNavigationMenu = window.attachNavigationMenu || attachNavigationMenu;
})();

// ===== Initialize NavigationMenu Demo =====
(function initNavigationMenuDemo() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNavigationMenuDemo);
  } else {
    setupNavigationMenuDemo();
  }

  function setupNavigationMenuDemo() {
    const container = document.getElementById('navigationMenuDemo');
    if (!container) return;

    // Create navigation menu
    const nav = createNavigationMenu();
    const list = createNavigationMenuList();

    // ===== Getting Started Item =====
    const item1 = createNavigationMenuItem({ value: 'getting-started' });
    const trigger1 = createNavigationMenuTrigger({ label: 'Getting Started' });
    const content1 = createNavigationMenuContent();
    content1.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 16px; width: 500px;">
        <a href="#" class="navigation-menu-link" style="display: flex; flex-direction: column; gap: 4px;" onclick="event.preventDefault(); showNotification('Introduction clicked');">
          <div style="font-weight: 600;">Introduction</div>
          <div style="font-size: 13px; color: var(--text-muted);">Get started with our platform</div>
        </a>
        <a href="#" class="navigation-menu-link" style="display: flex; flex-direction: column; gap: 4px;" onclick="event.preventDefault(); showNotification('Installation clicked');">
          <div style="font-weight: 600;">Installation</div>
          <div style="font-size: 13px; color: var(--text-muted);">Install and set up your environment</div>
        </a>
        <a href="#" class="navigation-menu-link" style="display: flex; flex-direction: column; gap: 4px;" onclick="event.preventDefault(); showNotification('Quick Start clicked');">
          <div style="font-weight: 600;">Quick Start</div>
          <div style="font-size: 13px; color: var(--text-muted);">Build your first application</div>
        </a>
        <a href="#" class="navigation-menu-link" style="display: flex; flex-direction: column; gap: 4px;" onclick="event.preventDefault(); showNotification('Examples clicked');">
          <div style="font-weight: 600;">Examples</div>
          <div style="font-size: 13px; color: var(--text-muted);">Browse example projects</div>
        </a>
      </div>
    `;
    item1.appendChild(trigger1);
    item1.appendChild(content1);
    list.appendChild(item1);

    // ===== Components Item =====
    const item2 = createNavigationMenuItem({ value: 'components' });
    const trigger2 = createNavigationMenuTrigger({ label: 'Components' });
    const content2 = createNavigationMenuContent();
    content2.innerHTML = `
      <div style="display: flex; gap: 16px; padding: 16px; width: 600px;">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 8px; padding: 0 12px; font-size: 13px; color: var(--text-muted);">Layout</div>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Card clicked');">Card</a>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Dialog clicked');">Dialog</a>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Drawer clicked');">Drawer</a>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Tabs clicked');">Tabs</a>
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 8px; padding: 0 12px; font-size: 13px; color: var(--text-muted);">Forms</div>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Input clicked');">Input</a>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Button clicked');">Button</a>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Checkbox clicked');">Checkbox</a>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Select clicked');">Select</a>
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 8px; padding: 0 12px; font-size: 13px; color: var(--text-muted);">Navigation</div>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Menubar clicked');">Menubar</a>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('NavigationMenu clicked');">NavigationMenu</a>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Breadcrumb clicked');">Breadcrumb</a>
          <a href="#" class="navigation-menu-link" onclick="event.preventDefault(); showNotification('Dropdown clicked');">Dropdown</a>
        </div>
      </div>
    `;
    item2.appendChild(trigger2);
    item2.appendChild(content2);
    list.appendChild(item2);

    // ===== Documentation Item =====
    const item3 = createNavigationMenuItem({ value: 'documentation' });
    const trigger3 = createNavigationMenuTrigger({ label: 'Documentation' });
    const content3 = createNavigationMenuContent();
    content3.innerHTML = `
      <div style="padding: 16px; width: 400px;">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="#" class="navigation-menu-link" style="display: flex; align-items: center; gap: 12px;" onclick="event.preventDefault(); showNotification('API Reference clicked');">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <div>
              <div style="font-weight: 600;">API Reference</div>
              <div style="font-size: 13px; color: var(--text-muted);">Complete API documentation</div>
            </div>
          </a>
          <a href="#" class="navigation-menu-link" style="display: flex; align-items: center; gap: 12px;" onclick="event.preventDefault(); showNotification('Guides clicked');">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <div>
              <div style="font-weight: 600;">Guides</div>
              <div style="font-size: 13px; color: var(--text-muted);">Step-by-step tutorials</div>
            </div>
          </a>
          <a href="#" class="navigation-menu-link" style="display: flex; align-items: center; gap: 12px;" onclick="event.preventDefault(); showNotification('Best Practices clicked');">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <div>
              <div style="font-weight: 600;">Best Practices</div>
              <div style="font-size: 13px; color: var(--text-muted);">Tips and recommendations</div>
            </div>
          </a>
          <a href="#" class="navigation-menu-link" style="display: flex; align-items: center; gap: 12px;" onclick="event.preventDefault(); showNotification('FAQ clicked');">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div style="font-weight: 600;">FAQ</div>
              <div style="font-size: 13px; color: var(--text-muted);">Frequently asked questions</div>
            </div>
          </a>
        </div>
      </div>
    `;
    item3.appendChild(trigger3);
    item3.appendChild(content3);
    list.appendChild(item3);

    // Add list to nav
    nav.appendChild(list);

    // Add viewport and indicator
    nav.appendChild(createNavigationMenuViewport());
    const indicator = createNavigationMenuIndicator();
    list.appendChild(indicator);

    // Attach functionality
    attachNavigationMenu(nav, {
      onValueChange: (value) => {
        if (value) console.log('Navigation value:', value);
      }
    });

    // Add to container
    container.appendChild(nav);

    // Notification helper (reuse from menubar demo)
    window.showNotification = window.showNotification || function(message) {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideIn 0.2s ease-out;
        font-size: 14px;
        color: var(--text-primary);
      `;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'slideOut 0.2s ease-in';
        setTimeout(() => toast.remove(), 200);
      }, 2000);
    };
  }
})();

// ===== Pagination Component (Vanilla JS) =====
(function () {
  /**
   * Create pagination root nav element
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @param {string} [options.ariaLabel='pagination'] - ARIA label
   * @returns {HTMLElement}
   */
  function createPagination(options = {}) {
    const { className = '', ariaLabel = 'pagination' } = options;
    const el = document.createElement('nav');
    el.className = `pagination${className ? ' ' + className : ''}`;
    el.setAttribute('role', 'navigation');
    el.setAttribute('aria-label', ariaLabel);
    return el;
  }

  /**
   * Create pagination content (ul)
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLUListElement}
   */
  function createPaginationContent(options = {}) {
    const { className = '' } = options;
    const el = document.createElement('ul');
    el.className = `pagination-content${className ? ' ' + className : ''}`;
    return el;
  }

  /**
   * Create pagination item (li)
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLLIElement}
   */
  function createPaginationItem(options = {}) {
    const { className = '' } = options;
    const el = document.createElement('li');
    el.className = `pagination-item${className ? ' ' + className : ''}`;
    return el;
  }

  /**
   * Create pagination link
   * @param {Object} options
   * @param {string|number} [options.page] - Page number
   * @param {boolean} [options.isActive=false] - Active state
   * @param {boolean} [options.disabled=false] - Disabled state
   * @param {string} [options.href='#'] - Link href
   * @param {string} [options.className] - Extra CSS classes
   * @param {Function} [options.onClick] - Click handler
   * @returns {HTMLAnchorElement}
   */
  function createPaginationLink(options = {}) {
    const { page, isActive = false, disabled = false, href = '#', className = '', onClick } = options;
    const el = document.createElement('a');
    el.className = `pagination-link${className ? ' ' + className : ''}`;
    el.href = href;
    el.textContent = page !== undefined ? String(page) : '';
    
    if (isActive) el.setAttribute('aria-current', 'page');
    if (disabled) {
      el.setAttribute('aria-disabled', 'true');
      el.style.pointerEvents = 'none';
    }

    if (typeof onClick === 'function') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (!disabled) onClick(page, e);
      });
    }

    return el;
  }

  /**
   * Create pagination previous button
   * @param {Object} options
   * @param {boolean} [options.disabled=false] - Disabled state
   * @param {string} [options.href='#'] - Link href
   * @param {string} [options.className] - Extra CSS classes
   * @param {Function} [options.onClick] - Click handler
   * @returns {HTMLAnchorElement}
   */
  function createPaginationPrevious(options = {}) {
    const { disabled = false, href = '#', className = '', onClick } = options;
    const el = document.createElement('a');
    el.className = `pagination-previous${className ? ' ' + className : ''}`;
    el.href = href;
    el.setAttribute('aria-label', 'Go to previous page');

    const icon = document.createElement('svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.innerHTML = '<polyline points="15 18 9 12 15 6"/>';
    el.appendChild(icon);

    const text = document.createElement('span');
    text.textContent = 'Previous';
    el.appendChild(text);

    if (disabled) {
      el.setAttribute('aria-disabled', 'true');
      el.style.pointerEvents = 'none';
    }

    if (typeof onClick === 'function') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (!disabled) onClick(e);
      });
    }

    return el;
  }

  /**
   * Create pagination next button
   * @param {Object} options
   * @param {boolean} [options.disabled=false] - Disabled state
   * @param {string} [options.href='#'] - Link href
   * @param {string} [options.className] - Extra CSS classes
   * @param {Function} [options.onClick] - Click handler
   * @returns {HTMLAnchorElement}
   */
  function createPaginationNext(options = {}) {
    const { disabled = false, href = '#', className = '', onClick } = options;
    const el = document.createElement('a');
    el.className = `pagination-next${className ? ' ' + className : ''}`;
    el.href = href;
    el.setAttribute('aria-label', 'Go to next page');

    const text = document.createElement('span');
    text.textContent = 'Next';
    el.appendChild(text);

    const icon = document.createElement('svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.innerHTML = '<polyline points="9 18 15 12 9 6"/>';
    el.appendChild(icon);

    if (disabled) {
      el.setAttribute('aria-disabled', 'true');
      el.style.pointerEvents = 'none';
    }

    if (typeof onClick === 'function') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (!disabled) onClick(e);
      });
    }

    return el;
  }

  /**
   * Create pagination ellipsis
   * @param {Object} options
   * @param {string} [options.className] - Extra CSS classes
   * @returns {HTMLSpanElement}
   */
  function createPaginationEllipsis(options = {}) {
    const { className = '' } = options;
    const el = document.createElement('span');
    el.className = `pagination-ellipsis${className ? ' ' + className : ''}`;
    el.setAttribute('aria-hidden', 'true');

    const icon = document.createElement('svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.innerHTML = '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>';
    el.appendChild(icon);

    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = 'More pages';
    el.appendChild(srText);

    return el;
  }

  /**
   * Build a complete pagination component with automatic page generation
   * @param {Object} options
   * @param {number} options.currentPage - Current page number (1-indexed)
   * @param {number} options.totalPages - Total number of pages
   * @param {Function} [options.onPageChange] - Callback when page changes
   * @param {number} [options.siblingCount=1] - Number of siblings to show on each side
   * @param {boolean} [options.showPrevNext=true] - Show previous/next buttons
   * @param {string} [options.className] - Extra CSS classes for root
   * @returns {HTMLElement}
   */
  function buildPagination(options = {}) {
    const {
      currentPage = 1,
      totalPages = 1,
      onPageChange,
      siblingCount = 1,
      showPrevNext = true,
      className = ''
    } = options;

    const nav = createPagination({ className });
    const content = createPaginationContent();

    // Generate page numbers array with ellipsis
    const range = (start, end) => {
      const length = end - start + 1;
      return Array.from({ length }, (_, i) => start + i);
    };

    const generatePages = () => {
      const totalPageNumbers = siblingCount * 2 + 5; // siblings on each side + first + last + current + 2 ellipsis

      if (totalPages <= totalPageNumbers) {
        return range(1, totalPages);
      }

      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

      const shouldShowLeftEllipsis = leftSiblingIndex > 2;
      const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

      const firstPageIndex = 1;
      const lastPageIndex = totalPages;

      if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
        const leftItemCount = 3 + 2 * siblingCount;
        const leftRange = range(1, leftItemCount);
        return [...leftRange, 'ellipsis', totalPages];
      }

      if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
        const rightItemCount = 3 + 2 * siblingCount;
        const rightRange = range(totalPages - rightItemCount + 1, totalPages);
        return [firstPageIndex, 'ellipsis', ...rightRange];
      }

      if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
        const middleRange = range(leftSiblingIndex, rightSiblingIndex);
        return [firstPageIndex, 'ellipsis', ...middleRange, 'ellipsis', lastPageIndex];
      }
    };

    const pages = generatePages();

    // Previous button
    if (showPrevNext) {
      const prevItem = createPaginationItem();
      const prev = createPaginationPrevious({
        disabled: currentPage === 1,
        onClick: () => {
          if (currentPage > 1 && typeof onPageChange === 'function') {
            onPageChange(currentPage - 1);
          }
        }
      });
      prevItem.appendChild(prev);
      content.appendChild(prevItem);
    }

    // Page numbers
    pages.forEach((page) => {
      const item = createPaginationItem();
      
      if (page === 'ellipsis') {
        item.appendChild(createPaginationEllipsis());
      } else {
        const link = createPaginationLink({
          page,
          isActive: page === currentPage,
          onClick: (pageNum) => {
            if (typeof onPageChange === 'function') {
              onPageChange(pageNum);
            }
          }
        });
        item.appendChild(link);
      }
      
      content.appendChild(item);
    });

    // Next button
    if (showPrevNext) {
      const nextItem = createPaginationItem();
      const next = createPaginationNext({
        disabled: currentPage === totalPages,
        onClick: () => {
          if (currentPage < totalPages && typeof onPageChange === 'function') {
            onPageChange(currentPage + 1);
          }
        }
      });
      nextItem.appendChild(next);
      content.appendChild(nextItem);
    }

    nav.appendChild(content);
    return nav;
  }

  // Expose
  window.createPagination = window.createPagination || createPagination;
  window.createPaginationContent = window.createPaginationContent || createPaginationContent;
  window.createPaginationItem = window.createPaginationItem || createPaginationItem;
  window.createPaginationLink = window.createPaginationLink || createPaginationLink;
  window.createPaginationPrevious = window.createPaginationPrevious || createPaginationPrevious;
  window.createPaginationNext = window.createPaginationNext || createPaginationNext;
  window.createPaginationEllipsis = window.createPaginationEllipsis || createPaginationEllipsis;
  window.buildPagination = window.buildPagination || buildPagination;
})();

// ===== Initialize Popover Demo =====
(function initPopoverDemo() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPopoverDemo);
  } else {
    setupPopoverDemo();
  }

  function setupPopoverDemo() {
    const container = document.getElementById('popoverDemoContainer');
    if (!container) return;

    // Helper to create demo section
    function createDemoSection(title, description) {
      const section = document.createElement('div');
      section.style.cssText = 'display: flex; flex-direction: column; gap: 12px; min-width: 200px;';
      
      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
      titleEl.textContent = title;
      
      const descEl = document.createElement('div');
      descEl.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;';
      descEl.textContent = description;
      
      section.appendChild(titleEl);
      section.appendChild(descEl);
      
      return section;
    }

    // Demo 1: Basic Popover (Bottom)
    const demo1Section = createDemoSection('Basic Popover', 'Click to open below');
    const popover1 = window.createPopover();
    const trigger1 = window.createPopoverTrigger({
      className: 'btn btn-primary',
      children: 'Open Popover'
    });
    const content1 = window.createPopoverContent({ side: 'bottom', align: 'center' });
    content1.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Dimensions</h4>
        <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary);">Set the dimensions for the layer.</p>
        <div style="display: grid; gap: 8px;">
          <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 8px; align-items: center;">
            <label style="font-size: 0.75rem; color: var(--text-secondary);">Width</label>
            <input type="text" value="100%" style="padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.75rem;" />
          </div>
          <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 8px; align-items: center;">
            <label style="font-size: 0.75rem; color: var(--text-secondary);">Height</label>
            <input type="text" value="25px" style="padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.75rem;" />
          </div>
        </div>
      </div>
    `;
    window.attachPopover(popover1, trigger1, content1);
    demo1Section.appendChild(trigger1);
    container.appendChild(demo1Section);

    // Demo 2: Top Aligned Popover
    const demo2Section = createDemoSection('Top Aligned', 'Opens above trigger');
    const popover2 = window.createPopover();
    const trigger2 = window.createPopoverTrigger({
      className: 'btn btn-secondary',
      children: 'Open Above'
    });
    const content2 = window.createPopoverContent({ side: 'top', align: 'center' });
    content2.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Information</h4>
        <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">This popover opens above the trigger button with smooth animations.</p>
      </div>
    `;
    window.attachPopover(popover2, trigger2, content2);
    demo2Section.appendChild(trigger2);
    container.appendChild(demo2Section);

    // Demo 3: Start Aligned Popover
    const demo3Section = createDemoSection('Start Aligned', 'Aligned to start edge');
    const popover3 = window.createPopover();
    const trigger3 = window.createPopoverTrigger({
      className: 'btn btn-outline',
      children: 'Start Align'
    });
    trigger3.style.cssText = 'padding: 8px 16px; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); border-radius: 6px; cursor: pointer; font-size: 0.875rem;';
    const content3 = window.createPopoverContent({ side: 'bottom', align: 'start' });
    content3.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Settings</h4>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.875rem;">
            <input type="checkbox" checked style="cursor: pointer;" />
            <span style="color: var(--text-secondary);">Enable notifications</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.875rem;">
            <input type="checkbox" style="cursor: pointer;" />
            <span style="color: var(--text-secondary);">Auto-save changes</span>
          </label>
        </div>
      </div>
    `;
    window.attachPopover(popover3, trigger3, content3);
    demo3Section.appendChild(trigger3);
    container.appendChild(demo3Section);

    // Demo 4: End Aligned Popover
    const demo4Section = createDemoSection('End Aligned', 'Aligned to end edge');
    const popover4 = window.createPopover();
    const trigger4 = window.createPopoverTrigger({
      className: 'btn btn-outline',
      children: 'End Align'
    });
    trigger4.style.cssText = 'padding: 8px 16px; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); border-radius: 6px; cursor: pointer; font-size: 0.875rem;';
    const content4 = window.createPopoverContent({ side: 'bottom', align: 'end' });
    content4.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Quick Actions</h4>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <button style="padding: 6px 12px; border: none; background: var(--bg-secondary); color: var(--text-primary); border-radius: 4px; cursor: pointer; font-size: 0.875rem; text-align: left;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg-secondary)'">Edit</button>
          <button style="padding: 6px 12px; border: none; background: var(--bg-secondary); color: var(--text-primary); border-radius: 4px; cursor: pointer; font-size: 0.875rem; text-align: left;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg-secondary)'">Duplicate</button>
          <button style="padding: 6px 12px; border: none; background: var(--bg-secondary); color: var(--text-primary); border-radius: 4px; cursor: pointer; font-size: 0.875rem; text-align: left;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg-secondary)'">Archive</button>
        </div>
      </div>
    `;
    window.attachPopover(popover4, trigger4, content4);
    demo4Section.appendChild(trigger4);
    container.appendChild(demo4Section);

    console.log('Popover demos initialized successfully');
  }
    const container = document.getElementById('popoverDemoContainer');
    if (!container) return;

    // Helper to create demo section
    function createDemoSection(title, description) {
      const section = document.createElement('div');
      section.style.cssText = 'display: flex; flex-direction: column; gap: 12px; min-width: 200px;';
      
      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
      titleEl.textContent = title;
      
      const descEl = document.createElement('div');
      descEl.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;';
      descEl.textContent = description;
      
      section.appendChild(titleEl);
      section.appendChild(descEl);
      
      return section;
    }

    // Demo 1: Basic Popover (Bottom)
    const demo1Section = createDemoSection('Basic Popover', 'Click to open below');
    const popover1 = window.createPopover();
    const trigger1 = window.createPopoverTrigger({
      className: 'btn btn-primary',
      children: 'Open Popover'
    });
    const content1 = window.createPopoverContent({ side: 'bottom', align: 'center' });
    content1.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Dimensions</h4>
        <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary);">Set the dimensions for the layer.</p>
        <div style="display: grid; gap: 8px;">
          <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 8px; align-items: center;">
            <label style="font-size: 0.75rem; color: var(--text-secondary);">Width</label>
            <input type="text" value="100%" style="padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.75rem;" />
          </div>
          <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 8px; align-items: center;">
            <label style="font-size: 0.75rem; color: var(--text-secondary);">Height</label>
            <input type="text" value="25px" style="padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); font-size: 0.75rem;" />
          </div>
        </div>
      </div>
    `;
    window.attachPopover(popover1, trigger1, content1);
    demo1Section.appendChild(trigger1);
    container.appendChild(demo1Section);

    // Demo 2: Top Aligned Popover
    const demo2Section = createDemoSection('Top Aligned', 'Opens above trigger');
    const popover2 = window.createPopover();
    const trigger2 = window.createPopoverTrigger({
      className: 'btn btn-secondary',
      children: 'Open Above'
    });
    const content2 = window.createPopoverContent({ side: 'top', align: 'center' });
    content2.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Information</h4>
        <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">This popover opens above the trigger button with smooth animations.</p>
      </div>
    `;
    window.attachPopover(popover2, trigger2, content2);
    demo2Section.appendChild(trigger2);
    container.appendChild(demo2Section);

    // Demo 3: Start Aligned Popover
    const demo3Section = createDemoSection('Start Aligned', 'Aligned to start edge');
    const popover3 = window.createPopover();
    const trigger3 = window.createPopoverTrigger({
      className: 'btn btn-outline',
      children: 'Start Align'
    });
    trigger3.style.cssText = 'padding: 8px 16px; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); border-radius: 6px; cursor: pointer; font-size: 0.875rem;';
    const content3 = window.createPopoverContent({ side: 'bottom', align: 'start' });
    content3.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Settings</h4>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.875rem;">
            <input type="checkbox" checked style="cursor: pointer;" />
            <span style="color: var(--text-secondary);">Enable notifications</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.875rem;">
            <input type="checkbox" style="cursor: pointer;" />
            <span style="color: var(--text-secondary);">Auto-save changes</span>
          </label>
        </div>
      </div>
    `;
    window.attachPopover(popover3, trigger3, content3);
    demo3Section.appendChild(trigger3);
    container.appendChild(demo3Section);

    // Demo 4: End Aligned Popover
    const demo4Section = createDemoSection('End Aligned', 'Aligned to end edge');
    const popover4 = window.createPopover();
    const trigger4 = window.createPopoverTrigger({
      className: 'btn btn-outline',
      children: 'End Align'
    });
    trigger4.style.cssText = 'padding: 8px 16px; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); border-radius: 6px; cursor: pointer; font-size: 0.875rem;';
    const content4 = window.createPopoverContent({ side: 'bottom', align: 'end' });
    content4.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Quick Actions</h4>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <button style="padding: 6px 12px; border: none; background: var(--bg-secondary); color: var(--text-primary); border-radius: 4px; cursor: pointer; font-size: 0.875rem; text-align: left;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg-secondary)'">Edit</button>
          <button style="padding: 6px 12px; border: none; background: var(--bg-secondary); color: var(--text-primary); border-radius: 4px; cursor: pointer; font-size: 0.875rem; text-align: left;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg-secondary)'">Duplicate</button>
          <button style="padding: 6px 12px; border: none; background: var(--bg-secondary); color: var(--text-primary); border-radius: 4px; cursor: pointer; font-size: 0.875rem; text-align: left;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg-secondary)'">Archive</button>
        </div>
      </div>
    `;
    window.attachPopover(popover4, trigger4, content4);
    demo4Section.appendChild(trigger4);
    container.appendChild(demo4Section);

    console.log('Popover demos initialized successfully');
  }
})();

// ===== Resizable Component =====
/**
 * Creates a resizable panel group container
 * @param {Object} options - Configuration options
 * @param {string} [options.direction='horizontal'] - Layout direction: 'horizontal' or 'vertical'
 * @param {string} [options.className=''] - Additional CSS classes
 * @param {string} [options.id] - Optional ID for the panel group
 * @returns {HTMLElement} The panel group element
 */
window.createResizablePanelGroup = function(options = {}) {
  const {
    direction = 'horizontal',
    className = '',
    id
  } = options;

  const group = document.createElement('div');
  group.className = `resizable-panel-group ${className}`.trim();
  if (id) group.id = id;
  
  group.setAttribute('data-direction', direction);
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', `Resizable ${direction} panel group`);

  // Store panels and handles for internal management
  group._panels = [];
  group._handles = [];
  group._sizes = [];

  // Method to add a panel
  group.addPanel = function(panel, defaultSize = 50) {
    this._panels.push(panel);
    this._sizes.push(defaultSize);
    this.appendChild(panel);
    
    // Update panel size
    panel.style.flexBasis = `${defaultSize}%`;
    panel.setAttribute('data-panel-size', defaultSize);
    
    return this;
  };

  // Method to add a handle
  group.addHandle = function(handle) {
    this._handles.push(handle);
    this.appendChild(handle);
    
    // Attach resize logic
    const handleIndex = this._handles.length - 1;
    const leftPanelIndex = handleIndex;
    const rightPanelIndex = handleIndex + 1;
    
    let isDragging = false;
    let startPos = 0;
    let startSizes = [];
    
    const startDrag = (e) => {
      e.preventDefault();
      isDragging = true;
      
      handle.setAttribute('data-dragging', 'true');
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      
      // Store starting position
      startPos = direction === 'horizontal' ? e.clientX || e.touches?.[0]?.clientX : e.clientY || e.touches?.[0]?.clientY;
      startSizes = [...this._sizes];
      
      // Add global listeners
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchmove', onDrag, { passive: false });
      document.addEventListener('touchend', stopDrag);
    };
    
    const onDrag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const currentPos = direction === 'horizontal' ? e.clientX || e.touches?.[0]?.clientX : e.clientY || e.touches?.[0]?.clientY;
      const delta = currentPos - startPos;
      
      // Get group size
      const rect = this.getBoundingClientRect();
      const groupSize = direction === 'horizontal' ? rect.width : rect.height;
      const deltaPercent = (delta / groupSize) * 100;
      
      // Calculate new sizes
      const leftPanel = this._panels[leftPanelIndex];
      const rightPanel = this._panels[rightPanelIndex];
      
      if (!leftPanel || !rightPanel) return;
      
      const leftMinSize = parseFloat(leftPanel.getAttribute('data-min-size') || 0);
      const leftMaxSize = parseFloat(leftPanel.getAttribute('data-max-size') || 100);
      const rightMinSize = parseFloat(rightPanel.getAttribute('data-min-size') || 0);
      const rightMaxSize = parseFloat(rightPanel.getAttribute('data-max-size') || 100);
      
      let newLeftSize = startSizes[leftPanelIndex] + deltaPercent;
      let newRightSize = startSizes[rightPanelIndex] - deltaPercent;
      
      // Apply constraints
      newLeftSize = Math.max(leftMinSize, Math.min(leftMaxSize, newLeftSize));
      newRightSize = Math.max(rightMinSize, Math.min(rightMaxSize, newRightSize));
      
      // Update sizes
      this._sizes[leftPanelIndex] = newLeftSize;
      this._sizes[rightPanelIndex] = newRightSize;
      
      leftPanel.style.flexBasis = `${newLeftSize}%`;
      leftPanel.setAttribute('data-panel-size', newLeftSize);
      rightPanel.style.flexBasis = `${newRightSize}%`;
      rightPanel.setAttribute('data-panel-size', newRightSize);
      
      // Dispatch resize event
      leftPanel.dispatchEvent(new CustomEvent('panelresize', { detail: { size: newLeftSize } }));
      rightPanel.dispatchEvent(new CustomEvent('panelresize', { detail: { size: newRightSize } }));
    };
    
    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      
      handle.removeAttribute('data-dragging');
      document.body.style.cursor = '';
      
      // Remove global listeners
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('touchend', stopDrag);
    };
    
    // Attach event listeners
    handle.addEventListener('mousedown', startDrag);
    handle.addEventListener('touchstart', startDrag, { passive: false });
    
    // Keyboard support
    handle.addEventListener('keydown', (e) => {
      const step = 5; // 5% step
      let handled = false;
      
      const leftPanel = this._panels[leftPanelIndex];
      const rightPanel = this._panels[rightPanelIndex];
      
      if (!leftPanel || !rightPanel) return;
      
      const leftSize = this._sizes[leftPanelIndex];
      const rightSize = this._sizes[rightPanelIndex];
      
      const leftMinSize = parseFloat(leftPanel.getAttribute('data-min-size') || 0);
      const leftMaxSize = parseFloat(leftPanel.getAttribute('data-max-size') || 100);
      const rightMinSize = parseFloat(rightPanel.getAttribute('data-min-size') || 0);
      const rightMaxSize = parseFloat(rightPanel.getAttribute('data-max-size') || 100);
      
      if ((direction === 'horizontal' && e.key === 'ArrowLeft') || (direction === 'vertical' && e.key === 'ArrowUp')) {
        // Decrease left/top panel
        let newLeftSize = Math.max(leftMinSize, leftSize - step);
        let newRightSize = Math.min(rightMaxSize, rightSize + step);
        
        this._sizes[leftPanelIndex] = newLeftSize;
        this._sizes[rightPanelIndex] = newRightSize;
        
        leftPanel.style.flexBasis = `${newLeftSize}%`;
        leftPanel.setAttribute('data-panel-size', newLeftSize);
        rightPanel.style.flexBasis = `${newRightSize}%`;
        rightPanel.setAttribute('data-panel-size', newRightSize);
        
        handled = true;
      } else if ((direction === 'horizontal' && e.key === 'ArrowRight') || (direction === 'vertical' && e.key === 'ArrowDown')) {
        // Increase left/top panel
        let newLeftSize = Math.min(leftMaxSize, leftSize + step);
        let newRightSize = Math.max(rightMinSize, rightSize - step);
        
        this._sizes[leftPanelIndex] = newLeftSize;
        this._sizes[rightPanelIndex] = newRightSize;
        
        leftPanel.style.flexBasis = `${newLeftSize}%`;
        leftPanel.setAttribute('data-panel-size', newLeftSize);
        rightPanel.style.flexBasis = `${newRightSize}%`;
        rightPanel.setAttribute('data-panel-size', newRightSize);
        
        handled = true;
      }
      
      if (handled) {
        e.preventDefault();
        leftPanel.dispatchEvent(new CustomEvent('panelresize', { detail: { size: this._sizes[leftPanelIndex] } }));
        rightPanel.dispatchEvent(new CustomEvent('panelresize', { detail: { size: this._sizes[rightPanelIndex] } }));
      }
    });
    
    return this;
  };

  // Method to get panel sizes
  group.getSizes = function() {
    return [...this._sizes];
  };

  // Method to set panel sizes
  group.setSizes = function(sizes) {
    sizes.forEach((size, index) => {
      if (index < this._panels.length) {
        this._sizes[index] = size;
        const panel = this._panels[index];
        panel.style.flexBasis = `${size}%`;
        panel.setAttribute('data-panel-size', size);
      }
    });
    return this;
  };

  return group;
};

/**
 * Creates a resizable panel
 * @param {Object} options - Configuration options
 * @param {number} [options.defaultSize=50] - Default size as percentage
 * @param {number} [options.minSize=0] - Minimum size as percentage
 * @param {number} [options.maxSize=100] - Maximum size as percentage
 * @param {string} [options.className=''] - Additional CSS classes
 * @param {string} [options.id] - Optional ID for the panel
 * @returns {HTMLElement} The panel element
 */
window.createResizablePanel = function(options = {}) {
  const {
    defaultSize = 50,
    minSize = 0,
    maxSize = 100,
    className = '',
    id
  } = options;

  const panel = document.createElement('div');
  panel.className = `resizable-panel ${className}`.trim();
  if (id) panel.id = id;
  
  panel.setAttribute('data-min-size', minSize);
  panel.setAttribute('data-max-size', maxSize);
  panel.setAttribute('data-panel-size', defaultSize);
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Resizable panel');
  
  panel.style.flexBasis = `${defaultSize}%`;

  // Method to get current size
  panel.getSize = function() {
    return parseFloat(this.getAttribute('data-panel-size') || defaultSize);
  };

  // Method to set size
  panel.setSize = function(size) {
    const constrainedSize = Math.max(minSize, Math.min(maxSize, size));
    this.style.flexBasis = `${constrainedSize}%`;
    this.setAttribute('data-panel-size', constrainedSize);
    this.dispatchEvent(new CustomEvent('panelresize', { detail: { size: constrainedSize } }));
    return this;
  };

  return panel;
};

/**
 * Creates a resizable handle (drag area between panels)
 * @param {Object} options - Configuration options
 * @param {boolean} [options.withHandle=true] - Whether to show the grip handle
 * @param {string} [options.className=''] - Additional CSS classes
 * @param {string} [options.id] - Optional ID for the handle
 * @returns {HTMLElement} The handle element
 */
window.createResizableHandle = function(options = {}) {
  const {
    withHandle = true,
    className = '',
    id
  } = options;

  const handle = document.createElement('div');
  handle.className = `resizable-handle ${className}`.trim();
  if (id) handle.id = id;
  
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-label', 'Resize handle');
  handle.setAttribute('aria-orientation', 'vertical'); // Will be updated based on parent direction
  handle.setAttribute('tabindex', '0');

  if (withHandle) {
    const grip = document.createElement('div');
    grip.className = 'resizable-handle-grip';
    grip.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="5" r="1.5"/><circle cx="11" cy="5" r="1.5"/><circle cx="5" cy="11" r="1.5"/><circle cx="11" cy="11" r="1.5"/></svg>';
    handle.appendChild(grip);
  }

  return handle;
};

// ===== Initialize Progress Demo =====
(function initProgressDemo() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupProgressDemo);
  } else {
    setupProgressDemo();
  }

  function setupProgressDemo() {
    const container = document.getElementById('progressDemoContainer');
    if (!container) return;

    // Helper to create demo section
    function createDemoSection(title, description) {
      const section = document.createElement('div');
      section.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
      
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
      
      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
      titleEl.textContent = title;
      
      const descEl = document.createElement('div');
      descEl.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary);';
      descEl.textContent = description;
      
      header.appendChild(titleEl);
      header.appendChild(descEl);
      section.appendChild(header);
      
      return section;
    }

    // Demo 1: Static Progress Values
    const staticSection = document.createElement('div');
    staticSection.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
    
    const staticTitle = document.createElement('h4');
    staticTitle.textContent = 'Static Values';
    staticTitle.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    staticSection.appendChild(staticTitle);

    [0, 25, 50, 75, 100].forEach(val => {
      const demo = createDemoSection(`${val}% Complete`, '');
      const progress = window.createProgress({ value: val });
      demo.appendChild(progress);
      staticSection.appendChild(demo);
    });

    container.appendChild(staticSection);

    // Demo 2: Animated Progress
    const animSection = document.createElement('div');
    animSection.style.cssText = 'display: flex; flex-direction: column; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);';
    
    const animTitle = document.createElement('h4');
    animTitle.textContent = 'Animated Progress';
    animTitle.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    animSection.appendChild(animTitle);

    const animDemo = createDemoSection('Loading...', '0%');
    const animProgress = window.createProgress({ value: 0 });
    animDemo.appendChild(animProgress);
    animSection.appendChild(animDemo);

    // Animate the progress
    let currentValue = 0;
    const animInterval = setInterval(() => {
      currentValue += 1;
      animProgress.setValue(currentValue);
      animDemo.querySelector('[style*=\"font-size: 0.75rem\"]').textContent = `${currentValue}%`;
      
      if (currentValue >= 100) {
        clearInterval(animInterval);
        animDemo.querySelector('[style*=\"font-weight: 600\"]').textContent = 'Complete!';
      }
    }, 30);

    container.appendChild(animSection);

    // Demo 3: Interactive Progress
    const interactiveSection = document.createElement('div');
    interactiveSection.style.cssText = 'display: flex; flex-direction: column; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);';
    
    const interactiveTitle = document.createElement('h4');
    interactiveTitle.textContent = 'Interactive Controls';
    interactiveTitle.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    interactiveSection.appendChild(interactiveTitle);

    const interactiveDemo = createDemoSection('Adjustable', '50%');
    const interactiveProgress = window.createProgress({ value: 50 });
    interactiveDemo.appendChild(interactiveProgress);

    // Add slider control
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = '50';
    slider.style.cssText = 'width: 100%; cursor: pointer;';
    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      interactiveProgress.setValue(value);
      interactiveDemo.querySelector('[style*=\"font-size: 0.75rem\"]').textContent = `${value}%`;
    });
    interactiveDemo.appendChild(slider);

    // Add buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

    const decreaseBtn = document.createElement('button');
    decreaseBtn.textContent = '-10';
    decreaseBtn.className = 'btn btn-secondary';
    decreaseBtn.style.cssText = 'padding: 6px 12px; font-size: 0.75rem;';
    decreaseBtn.addEventListener('click', () => {
      const currentVal = interactiveProgress.getValue();
      const newVal = Math.max(0, currentVal - 10);
      interactiveProgress.setValue(newVal);
      slider.value = newVal.toString();
      interactiveDemo.querySelector('[style*=\"font-size: 0.75rem\"]').textContent = `${newVal}%`;
    });

    const increaseBtn = document.createElement('button');
    increaseBtn.textContent = '+10';
    increaseBtn.className = 'btn btn-primary';
    increaseBtn.style.cssText = 'padding: 6px 12px; font-size: 0.75rem;';
    increaseBtn.addEventListener('click', () => {
      const currentVal = interactiveProgress.getValue();
      const newVal = Math.min(100, currentVal + 10);
      interactiveProgress.setValue(newVal);
      slider.value = newVal.toString();
      interactiveDemo.querySelector('[style*=\"font-size: 0.75rem\"]').textContent = `${newVal}%`;
    });

    buttonContainer.appendChild(decreaseBtn);
    buttonContainer.appendChild(increaseBtn);
    interactiveDemo.appendChild(buttonContainer);

    interactiveSection.appendChild(interactiveDemo);
    container.appendChild(interactiveSection);

    console.log('Progress demos initialized successfully');
  }
    const container = document.getElementById('progressDemoContainer');
    if (!container) return;

    // Helper to create demo section
    function createDemoSection(title, description) {
      const section = document.createElement('div');
      section.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
      
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
      
      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
      titleEl.textContent = title;
      
      const descEl = document.createElement('div');
      descEl.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary);';
      descEl.textContent = description;
      
      header.appendChild(titleEl);
      header.appendChild(descEl);
      section.appendChild(header);
      
      return section;
    }

    // Demo 1: Static Progress Values
    const staticSection = document.createElement('div');
    staticSection.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
    
    const staticTitle = document.createElement('h4');
    staticTitle.textContent = 'Static Values';
    staticTitle.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    staticSection.appendChild(staticTitle);

    [0, 25, 50, 75, 100].forEach(val => {
      const demo = createDemoSection(`${val}% Complete`, '');
      const progress = window.createProgress({ value: val });
      demo.appendChild(progress);
      staticSection.appendChild(demo);
    });

    container.appendChild(staticSection);

    // Demo 2: Animated Progress
    const animSection = document.createElement('div');
    animSection.style.cssText = 'display: flex; flex-direction: column; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);';
    
    const animTitle = document.createElement('h4');
    animTitle.textContent = 'Animated Progress';
    animTitle.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    animSection.appendChild(animTitle);

    const animDemo = createDemoSection('Loading...', '0%');
    const animProgress = window.createProgress({ value: 0 });
    animDemo.appendChild(animProgress);
    animSection.appendChild(animDemo);

    // Animate the progress
    let currentValue = 0;
    const animInterval = setInterval(() => {
      currentValue += 1;
      animProgress.setValue(currentValue);
      animDemo.querySelector('[style*="font-size: 0.75rem"]').textContent = `${currentValue}%`;
      
      if (currentValue >= 100) {
        clearInterval(animInterval);
        animDemo.querySelector('[style*="font-weight: 600"]').textContent = 'Complete!';
      }
    }, 30);

    container.appendChild(animSection);

    // Demo 3: Interactive Progress
    const interactiveSection = document.createElement('div');
    interactiveSection.style.cssText = 'display: flex; flex-direction: column; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);';
    
    const interactiveTitle = document.createElement('h4');
    interactiveTitle.textContent = 'Interactive Controls';
    interactiveTitle.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    interactiveSection.appendChild(interactiveTitle);

    const interactiveDemo = createDemoSection('Adjustable', '50%');
    const interactiveProgress = window.createProgress({ value: 50 });
    interactiveDemo.appendChild(interactiveProgress);

    // Add slider control
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = '50';
    slider.style.cssText = 'width: 100%; cursor: pointer;';
    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      interactiveProgress.setValue(value);
      interactiveDemo.querySelector('[style*="font-size: 0.75rem"]').textContent = `${value}%`;
    });
    interactiveDemo.appendChild(slider);

    // Add buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

    const decreaseBtn = document.createElement('button');
    decreaseBtn.textContent = '-10';
    decreaseBtn.className = 'btn btn-secondary';
    decreaseBtn.style.cssText = 'padding: 6px 12px; font-size: 0.75rem;';
    decreaseBtn.addEventListener('click', () => {
      const currentVal = interactiveProgress.getValue();
      const newVal = Math.max(0, currentVal - 10);
      interactiveProgress.setValue(newVal);
      slider.value = newVal.toString();
      interactiveDemo.querySelector('[style*="font-size: 0.75rem"]').textContent = `${newVal}%`;
    });

    const increaseBtn = document.createElement('button');
    increaseBtn.textContent = '+10';
    increaseBtn.className = 'btn btn-primary';
    increaseBtn.style.cssText = 'padding: 6px 12px; font-size: 0.75rem;';
    increaseBtn.addEventListener('click', () => {
      const currentVal = interactiveProgress.getValue();
      const newVal = Math.min(100, currentVal + 10);
      interactiveProgress.setValue(newVal);
      slider.value = newVal.toString();
      interactiveDemo.querySelector('[style*="font-size: 0.75rem"]').textContent = `${newVal}%`;
    });

    buttonContainer.appendChild(decreaseBtn);
    buttonContainer.appendChild(increaseBtn);
    interactiveDemo.appendChild(buttonContainer);

    interactiveSection.appendChild(interactiveDemo);
    container.appendChild(interactiveSection);

    console.log('Progress demos initialized successfully');
  }
})();

// ===== Initialize RadioGroup Demo =====
(function initRadioGroupDemo() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRadioGroupDemo);
  } else {
    setupRadioGroupDemo();
  }

  function setupRadioGroupDemo() {
    const container = document.getElementById('radioGroupDemoContainer');
    if (!container) return;

    // Demo 1: Basic Radio Group
    const demo1 = document.createElement('div');
    demo1.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
    
    const demo1Title = document.createElement('h4');
    demo1Title.textContent = 'Select a notification method';
    demo1Title.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    demo1.appendChild(demo1Title);

    const radioGroup1 = window.createRadioGroup({ 
      value: 'email',
      onValueChange: (value) => {
        demo1Result.textContent = `Selected: ${value}`;
      }
    });

    const options1 = [
      { value: 'email', label: 'Email' },
      { value: 'sms', label: 'SMS' },
      { value: 'push', label: 'Push Notification' }
    ];

    options1.forEach(opt => {
      const itemWrapper = document.createElement('div');
      itemWrapper.style.cssText = 'display: flex; align-items: center; gap: 12px;';
      
      const item = window.createRadioGroupItem({ 
        value: opt.value,
        id: `notify-${opt.value}`
      });
      radioGroup1.addItem(item);
      
      const label = document.createElement('label');
      label.setAttribute('for', `notify-${opt.value}`);
      label.textContent = opt.label;
      label.style.cssText = 'cursor: pointer; font-size: 0.875rem; color: var(--text-primary);';
      label.addEventListener('click', () => {
        if (!item.hasAttribute('disabled')) {
          radioGroup1.setValue(opt.value);
        }
      });
      
      itemWrapper.appendChild(item);
      itemWrapper.appendChild(label);
      radioGroup1.appendChild(itemWrapper);
    });

    demo1.appendChild(radioGroup1);

    const demo1Result = document.createElement('div');
    demo1Result.textContent = 'Selected: email';
    demo1Result.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;';
    demo1.appendChild(demo1Result);

    container.appendChild(demo1);

    // Demo 2: Disabled Options
    const demo2 = document.createElement('div');
    demo2.style.cssText = 'display: flex; flex-direction: column; gap: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);';
    
    const demo2Title = document.createElement('h4');
    demo2Title.textContent = 'Choose your plan';
    demo2Title.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    demo2.appendChild(demo2Title);

    const radioGroup2 = window.createRadioGroup({ 
      value: 'free',
      onValueChange: (value) => {
        demo2Result.textContent = `Selected plan: ${value}`;
      }
    });

    const options2 = [
      { value: 'free', label: 'Free', description: '$0/month', disabled: false },
      { value: 'pro', label: 'Pro', description: '$9/month', disabled: false },
      { value: 'enterprise', label: 'Enterprise', description: 'Contact sales', disabled: true }
    ];

    options2.forEach(opt => {
      const itemWrapper = document.createElement('div');
      itemWrapper.style.cssText = 'display: flex; align-items: start; gap: 12px;';
      
      const item = window.createRadioGroupItem({ 
        value: opt.value,
        id: `plan-${opt.value}`,
        disabled: opt.disabled
      });
      radioGroup2.addItem(item);
      
      const labelWrapper = document.createElement('div');
      labelWrapper.style.cssText = 'display: flex; flex-direction: column;';
      
      const label = document.createElement('label');
      label.setAttribute('for', `plan-${opt.value}`);
      label.textContent = opt.label;
      label.style.cssText = `cursor: ${opt.disabled ? 'not-allowed' : 'pointer'}; font-size: 0.875rem; color: var(--text-primary); opacity: ${opt.disabled ? '0.5' : '1'};`;
      if (!opt.disabled) {
        label.addEventListener('click', () => radioGroup2.setValue(opt.value));
      }
      
      const desc = document.createElement('span');
      desc.textContent = opt.description;
      desc.style.cssText = `font-size: 0.75rem; color: var(--text-secondary); opacity: ${opt.disabled ? '0.5' : '1'};`;
      
      labelWrapper.appendChild(label);
      labelWrapper.appendChild(desc);
      
      itemWrapper.appendChild(item);
      itemWrapper.appendChild(labelWrapper);
      radioGroup2.appendChild(itemWrapper);
    });

    demo2.appendChild(radioGroup2);

    const demo2Result = document.createElement('div');
    demo2Result.textContent = 'Selected plan: free';
    demo2Result.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;';
    demo2.appendChild(demo2Result);

    container.appendChild(demo2);

    // Demo 3: Card-style Radio Group
    const demo3 = document.createElement('div');
    demo3.style.cssText = 'display: flex; flex-direction: column; gap: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);';
    
    const demo3Title = document.createElement('h4');
    demo3Title.textContent = 'Select payment method';
    demo3Title.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    demo3.appendChild(demo3Title);

    const radioGroup3 = window.createRadioGroup({ 
      value: 'card',
      onValueChange: (value) => {
        demo3Result.textContent = `Payment method: ${value}`;
        
        // Update card styles
        options3.forEach(opt => {
          const card = document.getElementById(`payment-card-${opt.value}`);
          if (card) {
            if (opt.value === value) {
              card.style.borderColor = 'var(--brand-color)';
              card.style.backgroundColor = 'rgba(67, 56, 202, 0.05)';
            } else {
              card.style.borderColor = 'var(--border-color)';
              card.style.backgroundColor = 'transparent';
            }
          }
        });
      }
    });

    const options3 = [
      { value: 'card', label: 'Credit Card', icon: '💳' },
      { value: 'paypal', label: 'PayPal', icon: '🅿️' },
      { value: 'crypto', label: 'Cryptocurrency', icon: '₿' }
    ];

    options3.forEach(opt => {
      const card = document.createElement('div');
      card.id = `payment-card-${opt.value}`;
      card.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 2px solid ${opt.value === 'card' ? 'var(--brand-color)' : 'var(--border-color)'};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
        background: ${opt.value === 'card' ? 'rgba(67, 56, 202, 0.05)' : 'transparent'};
      `;
      
      card.addEventListener('mouseenter', () => {
        if (radioGroup3.getValue() !== opt.value) {
          card.style.borderColor = 'var(--text-secondary)';
        }
      });
      
      card.addEventListener('mouseleave', () => {
        if (radioGroup3.getValue() !== opt.value) {
          card.style.borderColor = 'var(--border-color)';
        }
      });
      
      const item = window.createRadioGroupItem({ 
        value: opt.value,
        id: `payment-${opt.value}`
      });
      radioGroup3.addItem(item);
      
      const icon = document.createElement('span');
      icon.textContent = opt.icon;
      icon.style.cssText = 'font-size: 1.5rem;';
      
      const label = document.createElement('label');
      label.setAttribute('for', `payment-${opt.value}`);
      label.textContent = opt.label;
      label.style.cssText = 'cursor: pointer; font-size: 0.875rem; color: var(--text-primary); flex: 1;';
      
      card.addEventListener('click', () => radioGroup3.setValue(opt.value));
      
      card.appendChild(item);
      card.appendChild(icon);
      card.appendChild(label);
      radioGroup3.appendChild(card);
    });

    demo3.appendChild(radioGroup3);

    const demo3Result = document.createElement('div');
    demo3Result.textContent = 'Payment method: card';
    demo3Result.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;';
    demo3.appendChild(demo3Result);

    container.appendChild(demo3);

    console.log('RadioGroup demos initialized successfully');
  }
    demo1.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
    
    const demo1Title = document.createElement('h4');
    demo1Title.textContent = 'Select a notification method';
    demo1Title.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    demo1.appendChild(demo1Title);

    const radioGroup1 = window.createRadioGroup({ 
      value: 'email',
      onValueChange: (value) => {
        demo1Result.textContent = `Selected: ${value}`;
      }
    });

    const options1 = [
      { value: 'email', label: 'Email' },
      { value: 'sms', label: 'SMS' },
      { value: 'push', label: 'Push Notification' }
    ];

    options1.forEach(opt => {
      const itemWrapper = document.createElement('div');
      itemWrapper.style.cssText = 'display: flex; align-items: center; gap: 12px;';
      
      const item = window.createRadioGroupItem({ 
        value: opt.value,
        id: `notify-${opt.value}`
      });
      radioGroup1.addItem(item);
      
      const label = document.createElement('label');
      label.setAttribute('for', `notify-${opt.value}`);
      label.textContent = opt.label;
      label.style.cssText = 'cursor: pointer; font-size: 0.875rem; color: var(--text-primary);';
      label.addEventListener('click', () => {
        if (!item.hasAttribute('disabled')) {
          radioGroup1.setValue(opt.value);
        }
      });
      
      itemWrapper.appendChild(item);
      itemWrapper.appendChild(label);
      radioGroup1.appendChild(itemWrapper);
    });

    demo1.appendChild(radioGroup1);

    const demo1Result = document.createElement('div');
    demo1Result.textContent = 'Selected: email';
    demo1Result.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;';
    demo1.appendChild(demo1Result);

    container.appendChild(demo1);

    // Demo 2: Disabled Options
    const demo2 = document.createElement('div');
    demo2.style.cssText = 'display: flex; flex-direction: column; gap: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);';
    
    const demo2Title = document.createElement('h4');
    demo2Title.textContent = 'Choose your plan';
    demo2Title.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    demo2.appendChild(demo2Title);

    const radioGroup2 = window.createRadioGroup({ 
      value: 'free',
      onValueChange: (value) => {
        demo2Result.textContent = `Selected plan: ${value}`;
      }
    });

    const options2 = [
      { value: 'free', label: 'Free', description: '$0/month', disabled: false },
      { value: 'pro', label: 'Pro', description: '$9/month', disabled: false },
      { value: 'enterprise', label: 'Enterprise', description: 'Contact sales', disabled: true }
    ];

    options2.forEach(opt => {
      const itemWrapper = document.createElement('div');
      itemWrapper.style.cssText = 'display: flex; align-items: start; gap: 12px;';
      
      const item = window.createRadioGroupItem({ 
        value: opt.value,
        id: `plan-${opt.value}`,
        disabled: opt.disabled
      });
      radioGroup2.addItem(item);
      
      const labelWrapper = document.createElement('div');
      labelWrapper.style.cssText = 'display: flex; flex-direction: column;';
      
      const label = document.createElement('label');
      label.setAttribute('for', `plan-${opt.value}`);
      label.textContent = opt.label;
      label.style.cssText = `cursor: ${opt.disabled ? 'not-allowed' : 'pointer'}; font-size: 0.875rem; color: var(--text-primary); opacity: ${opt.disabled ? '0.5' : '1'};`;
      if (!opt.disabled) {
        label.addEventListener('click', () => radioGroup2.setValue(opt.value));
      }
      
      const desc = document.createElement('span');
      desc.textContent = opt.description;
      desc.style.cssText = `font-size: 0.75rem; color: var(--text-secondary); opacity: ${opt.disabled ? '0.5' : '1'};`;
      
      labelWrapper.appendChild(label);
      labelWrapper.appendChild(desc);
      
      itemWrapper.appendChild(item);
      itemWrapper.appendChild(labelWrapper);
      radioGroup2.appendChild(itemWrapper);
    });

    demo2.appendChild(radioGroup2);

    const demo2Result = document.createElement('div');
    demo2Result.textContent = 'Selected plan: free';
    demo2Result.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;';
    demo2.appendChild(demo2Result);

    container.appendChild(demo2);

    // Demo 3: Card-style Radio Group
    const demo3 = document.createElement('div');
    demo3.style.cssText = 'display: flex; flex-direction: column; gap: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);';
    
    const demo3Title = document.createElement('h4');
    demo3Title.textContent = 'Select payment method';
    demo3Title.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);';
    demo3.appendChild(demo3Title);

    const radioGroup3 = window.createRadioGroup({ 
      value: 'card',
      onValueChange: (value) => {
        demo3Result.textContent = `Payment method: ${value}`;
        
        // Update card styles
        options3.forEach(opt => {
          const card = document.getElementById(`payment-card-${opt.value}`);
          if (card) {
            if (opt.value === value) {
              card.style.borderColor = 'var(--brand-color)';
              card.style.backgroundColor = 'rgba(var(--brand-color-rgb), 0.05)';
            } else {
              card.style.borderColor = 'var(--border-color)';
              card.style.backgroundColor = 'transparent';
            }
          }
        });
      }
    });

    const options3 = [
      { value: 'card', label: 'Credit Card', icon: '💳' },
      { value: 'paypal', label: 'PayPal', icon: '🅿️' },
      { value: 'crypto', label: 'Cryptocurrency', icon: '₿' }
    ];

    options3.forEach(opt => {
      const card = document.createElement('div');
      card.id = `payment-card-${opt.value}`;
      card.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 2px solid ${opt.value === 'card' ? 'var(--brand-color)' : 'var(--border-color)'};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
        background: ${opt.value === 'card' ? 'rgba(var(--brand-color-rgb), 0.05)' : 'transparent'};
      `;
      
      card.addEventListener('mouseenter', () => {
        if (radioGroup3.getValue() !== opt.value) {
          card.style.borderColor = 'var(--text-secondary)';
        }
      });
      
      card.addEventListener('mouseleave', () => {
        if (radioGroup3.getValue() !== opt.value) {
          card.style.borderColor = 'var(--border-color)';
        }
      });
      
      const item = window.createRadioGroupItem({ 
        value: opt.value,
        id: `payment-${opt.value}`
      });
      radioGroup3.addItem(item);
      
      const icon = document.createElement('span');
      icon.textContent = opt.icon;
      icon.style.cssText = 'font-size: 1.5rem;';
      
      const label = document.createElement('label');
      label.setAttribute('for', `payment-${opt.value}`);
      label.textContent = opt.label;
      label.style.cssText = 'cursor: pointer; font-size: 0.875rem; color: var(--text-primary); flex: 1;';
      
      card.addEventListener('click', () => radioGroup3.setValue(opt.value));
      
      card.appendChild(item);
      card.appendChild(icon);
      card.appendChild(label);
      radioGroup3.appendChild(card);
    });

    demo3.appendChild(radioGroup3);

    const demo3Result = document.createElement('div');
    demo3Result.textContent = 'Payment method: card';
    demo3Result.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;';
    demo3.appendChild(demo3Result);

    container.appendChild(demo3);

    console.log('RadioGroup demos initialized successfully');
  }
})();

// ===== ScrollArea Component =====
/**
 * Creates a scroll area with custom scrollbars
 * @param {Object} options - Configuration options
 * @param {string} [options.className=''] - Additional CSS classes
 * @param {string} [options.id] - Optional ID for the scroll area
 * @returns {HTMLElement} The scroll area element
 */
window.createScrollArea = function(options = {}) {
  const {
    className = '',
    id
  } = options;

  const root = document.createElement('div');
  root.className = `scroll-area ${className}`.trim();
  if (id) root.id = id;
  
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Scrollable area');

  // Create viewport
  const viewport = document.createElement('div');
  viewport.className = 'scroll-area-viewport';
  viewport.setAttribute('role', 'document');
  
  const viewportContent = document.createElement('div');
  viewportContent.className = 'scroll-area-viewport-content';
  viewportContent.setAttribute('tabindex', '0');

  viewport.appendChild(viewportContent);
  root.appendChild(viewport);

  // Vertical scrollbar
  const verticalScrollbar = document.createElement('div');
  verticalScrollbar.className = 'scroll-area-scrollbar';
  verticalScrollbar.setAttribute('data-orientation', 'vertical');
  verticalScrollbar.setAttribute('aria-orientation', 'vertical');
  verticalScrollbar.setAttribute('role', 'slider');
  verticalScrollbar.setAttribute('aria-valuemin', '0');
  verticalScrollbar.setAttribute('aria-valuemax', '100');
  verticalScrollbar.setAttribute('aria-valuenow', '0');

  const verticalThumb = document.createElement('div');
  verticalThumb.className = 'scroll-area-thumb';
  verticalScrollbar.appendChild(verticalThumb);

  // Horizontal scrollbar
  const horizontalScrollbar = document.createElement('div');
  horizontalScrollbar.className = 'scroll-area-scrollbar';
  horizontalScrollbar.setAttribute('data-orientation', 'horizontal');
  horizontalScrollbar.setAttribute('aria-orientation', 'horizontal');
  horizontalScrollbar.setAttribute('role', 'slider');
  horizontalScrollbar.setAttribute('aria-valuemin', '0');
  horizontalScrollbar.setAttribute('aria-valuemax', '100');
  horizontalScrollbar.setAttribute('aria-valuenow', '0');

  const horizontalThumb = document.createElement('div');
  horizontalThumb.className = 'scroll-area-thumb';
  horizontalScrollbar.appendChild(horizontalThumb);

  // Corner element
  const corner = document.createElement('div');
  corner.className = 'scroll-area-corner';

  root.appendChild(verticalScrollbar);
  root.appendChild(horizontalScrollbar);
  root.appendChild(corner);

  // Internal state
  let isVerticalDragging = false;
  let isHorizontalDragging = false;
  let verticalStartY = 0;
  let horizontalStartX = 0;

  // Scrollbar positioning and sizing logic
  const updateScrollbars = () => {
    const viewportHeight = viewport.clientHeight;
    const contentHeight = viewportContent.scrollHeight;
    const scrollPercentageY = (viewportHeight / contentHeight) * 100;
    const scrollPositionY = (viewport.scrollTop / (contentHeight - viewportHeight)) * 100;

    // Update vertical scrollbar
    if (contentHeight > viewportHeight) {
      verticalScrollbar.style.display = 'flex';
      verticalThumb.style.height = `${Math.max(30, scrollPercentageY)}%`;
      verticalThumb.style.transform = `translateY(${scrollPositionY * (viewportHeight - verticalThumb.offsetHeight) / 100}px)`;
      verticalScrollbar.setAttribute('aria-valuenow', scrollPositionY.toFixed(0));
    } else {
      verticalScrollbar.style.display = 'none';
    }

    const viewportWidth = viewport.clientWidth;
    const contentWidth = viewportContent.scrollWidth;
    const scrollPercentageX = (viewportWidth / contentWidth) * 100;
    const scrollPositionX = (viewport.scrollLeft / (contentWidth - viewportWidth)) * 100;

    // Update horizontal scrollbar
    if (contentWidth > viewportWidth) {
      horizontalScrollbar.style.display = 'flex';
      horizontalThumb.style.width = `${Math.max(30, scrollPercentageX)}%`;
      horizontalThumb.style.transform = `translateX(${scrollPositionX * (viewportWidth - horizontalThumb.offsetWidth) / 100}px)`;
      horizontalScrollbar.setAttribute('aria-valuenow', scrollPositionX.toFixed(0));
    } else {
      horizontalScrollbar.style.display = 'none';
    }
  };

  // Viewport scroll listener
  viewport.addEventListener('scroll', updateScrollbars);

  // Vertical drag logic
  const startVerticalDrag = (e) => {
    e.preventDefault();
    isVerticalDragging = true;
    verticalStartY = e.clientY || e.touches?.[0]?.clientY;
    verticalThumb.setAttribute('data-dragging', 'true');
    
    document.addEventListener('mousemove', onVerticalDrag);
    document.addEventListener('mouseup', stopVerticalDrag);
    document.addEventListener('touchmove', onVerticalDrag, { passive: false });
    document.addEventListener('touchend', stopVerticalDrag);
  };

  const onVerticalDrag = (e) => {
    if (!isVerticalDragging) return;
    e.preventDefault();

    const currentY = e.clientY || e.touches?.[0]?.clientY;
    const delta = currentY - verticalStartY;
    
    const contentHeight = viewportContent.scrollHeight;
    const viewportHeight = viewport.clientHeight;
    const trackHeight = verticalScrollbar.clientHeight - verticalThumb.offsetHeight;
    
    const scrollPercentage = (delta / trackHeight) * ((contentHeight - viewportHeight) / contentHeight);
    viewport.scrollTop += scrollPercentage * (contentHeight - viewportHeight);
    
    verticalStartY = currentY;
  };

  const stopVerticalDrag = () => {
    isVerticalDragging = false;
    verticalThumb.removeAttribute('data-dragging');
    
    document.removeEventListener('mousemove', onVerticalDrag);
    document.removeEventListener('mouseup', stopVerticalDrag);
    document.removeEventListener('touchmove', onVerticalDrag);
    document.removeEventListener('touchend', stopVerticalDrag);
  };

  // Horizontal drag logic
  const startHorizontalDrag = (e) => {
    e.preventDefault();
    isHorizontalDragging = true;
    horizontalStartX = e.clientX || e.touches?.[0]?.clientX;
    horizontalThumb.setAttribute('data-dragging', 'true');
    
    document.addEventListener('mousemove', onHorizontalDrag);
    document.addEventListener('mouseup', stopHorizontalDrag);
    document.addEventListener('touchmove', onHorizontalDrag, { passive: false });
    document.addEventListener('touchend', stopHorizontalDrag);
  };

  const onHorizontalDrag = (e) => {
    if (!isHorizontalDragging) return;
    e.preventDefault();

    const currentX = e.clientX || e.touches?.[0]?.clientX;
    const delta = currentX - horizontalStartX;
    
    const contentWidth = viewportContent.scrollWidth;
    const viewportWidth = viewport.clientWidth;
    const trackWidth = horizontalScrollbar.clientWidth - horizontalThumb.offsetWidth;
    
    const scrollPercentage = (delta / trackWidth) * ((contentWidth - viewportWidth) / contentWidth);
    viewport.scrollLeft += scrollPercentage * (contentWidth - viewportWidth);
    
    horizontalStartX = currentX;
  };

  const stopHorizontalDrag = () => {
    isHorizontalDragging = false;
    horizontalThumb.removeAttribute('data-dragging');
    
    document.removeEventListener('mousemove', onHorizontalDrag);
    document.removeEventListener('mouseup', stopHorizontalDrag);
    document.removeEventListener('touchmove', onHorizontalDrag);
    document.removeEventListener('touchend', stopHorizontalDrag);
  };

  // Attach drag listeners
  verticalThumb.addEventListener('mousedown', startVerticalDrag);
  verticalThumb.addEventListener('touchstart', startVerticalDrag, { passive: false });
  horizontalThumb.addEventListener('mousedown', startHorizontalDrag);
  horizontalThumb.addEventListener('touchstart', startHorizontalDrag, { passive: false });

  // Viewport keyboard navigation
  viewportContent.addEventListener('keydown', (e) => {
    const scrollStep = 40; // pixels

    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        viewport.scrollTop -= scrollStep;
        break;
      case 'ArrowDown':
        e.preventDefault();
        viewport.scrollTop += scrollStep;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        viewport.scrollLeft -= scrollStep;
        break;
      case 'ArrowRight':
        e.preventDefault();
        viewport.scrollLeft += scrollStep;
        break;
      case 'Home':
        e.preventDefault();
        viewport.scrollTop = 0;
        break;
      case 'End':
        e.preventDefault();
        viewport.scrollTop = viewportContent.scrollHeight;
        break;
      case 'PageUp':
        e.preventDefault();
        viewport.scrollTop -= viewport.clientHeight;
        break;
      case 'PageDown':
        e.preventDefault();
        viewport.scrollTop += viewport.clientHeight;
        break;
    }
    
    updateScrollbars();
  });

  // Initialize scrollbars
  setTimeout(updateScrollbars, 0);

  // Expose public API
  root.getViewport = function() {
    return viewport;
  };

  root.getContent = function() {
    return viewportContent;
  };

  root.scrollToTop = function() {
    viewport.scrollTop = 0;
    updateScrollbars();
    return this;
  };

  root.scrollToBottom = function() {
    viewport.scrollTop = viewportContent.scrollHeight;
    updateScrollbars();
    return this;
  };

  root.scrollToLeft = function() {
    viewport.scrollLeft = 0;
    updateScrollbars();
    return this;
  };

  root.scrollToRight = function() {
    viewport.scrollLeft = viewportContent.scrollWidth;
    updateScrollbars();
    return this;
  };

  root.setScroll = function(scrollTop, scrollLeft) {
    viewport.scrollTop = scrollTop || 0;
    viewport.scrollLeft = scrollLeft || 0;
    updateScrollbars();
    return this;
  };

  return root;
};

// ===== Initialize Resizable Demo =====
(function initResizableDemo() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupResizableDemo);
  } else {
    setupResizableDemo();
  }

  function setupResizableDemo() {
    const container = document.getElementById('resizableDemoContainer');
    if (!container) return;

    // Helper to create demo section
    function createDemoSection(title, description) {
      const section = document.createElement('div');
      section.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
      
      const header = document.createElement('div');
      
      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem; margin-bottom: 4px;';
      titleEl.textContent = title;
      
      const descEl = document.createElement('div');
      descEl.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary);';
      descEl.textContent = description;
      
      header.appendChild(titleEl);
      header.appendChild(descEl);
      section.appendChild(header);
      
      return section;
    }

    // Helper to create panel content
    function createPanelContent(text, showSize = true) {
      const content = document.createElement('div');
      content.style.cssText = 'padding: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100px;';
      
      const textEl = document.createElement('div');
      textEl.style.cssText = 'font-weight: 600; color: var(--text-primary); margin-bottom: 8px;';
      textEl.textContent = text;
      content.appendChild(textEl);
      
      if (showSize) {
        const sizeEl = document.createElement('div');
        sizeEl.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary);';
        sizeEl.className = 'panel-size-indicator';
        content.appendChild(sizeEl);
      }
      
      return content;
    }

    // Demo 1: Horizontal 2-Panel Layout
    const demo1Section = createDemoSection('Horizontal Layout', 'Two resizable panels side by side');
    
    const demo1Group = window.createResizablePanelGroup({ 
      direction: 'horizontal',
      id: 'demo1Group'
    });
    demo1Group.style.cssText = 'height: 200px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;';
    
    const demo1Panel1 = window.createResizablePanel({ 
      defaultSize: 30, 
      minSize: 20, 
      maxSize: 50,
      id: 'demo1Panel1'
    });
    const demo1Panel1Content = createPanelContent('Sidebar');
    demo1Panel1Content.style.background = 'var(--bg-secondary)';
    demo1Panel1.appendChild(demo1Panel1Content);
    
    const demo1Handle = window.createResizableHandle({ withHandle: true });
    
    const demo1Panel2 = window.createResizablePanel({ 
      defaultSize: 70, 
      minSize: 50, 
      maxSize: 80,
      id: 'demo1Panel2'
    });
    const demo1Panel2Content = createPanelContent('Main Content');
    demo1Panel2Content.style.background = 'var(--bg-primary)';
    demo1Panel2.appendChild(demo1Panel2Content);
    
    demo1Group.addPanel(demo1Panel1, 30);
    demo1Group.addHandle(demo1Handle);
    demo1Group.addPanel(demo1Panel2, 70);
    
    // Update size indicators
    const updateDemo1Sizes = () => {
      const sizes = demo1Group.getSizes();
      demo1Panel1Content.querySelector('.panel-size-indicator').textContent = `${sizes[0].toFixed(1)}%`;
      demo1Panel2Content.querySelector('.panel-size-indicator').textContent = `${sizes[1].toFixed(1)}%`;
    };
    updateDemo1Sizes();
    
    demo1Panel1.addEventListener('panelresize', updateDemo1Sizes);
    demo1Panel2.addEventListener('panelresize', updateDemo1Sizes);
    
    demo1Section.appendChild(demo1Group);
    container.appendChild(demo1Section);

    // Demo 2: Horizontal 3-Panel Layout
    const demo2Section = createDemoSection('Three Column Layout', 'Three resizable panels with constraints');
    
    const demo2Group = window.createResizablePanelGroup({ 
      direction: 'horizontal',
      id: 'demo2Group'
    });
    demo2Group.style.cssText = 'height: 200px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;';
    
    const demo2Panel1 = window.createResizablePanel({ 
      defaultSize: 25, 
      minSize: 15, 
      maxSize: 40,
      id: 'demo2Panel1'
    });
    const demo2Panel1Content = createPanelContent('Left Sidebar');
    demo2Panel1Content.style.background = 'var(--bg-secondary)';
    demo2Panel1.appendChild(demo2Panel1Content);
    
    const demo2Handle1 = window.createResizableHandle({ withHandle: true });
    
    const demo2Panel2 = window.createResizablePanel({ 
      defaultSize: 50, 
      minSize: 30, 
      maxSize: 60,
      id: 'demo2Panel2'
    });
    const demo2Panel2Content = createPanelContent('Main Content');
    demo2Panel2Content.style.background = 'var(--bg-primary)';
    demo2Panel2.appendChild(demo2Panel2Content);
    
    const demo2Handle2 = window.createResizableHandle({ withHandle: true });
    
    const demo2Panel3 = window.createResizablePanel({ 
      defaultSize: 25, 
      minSize: 15, 
      maxSize: 40,
      id: 'demo2Panel3'
    });
    const demo2Panel3Content = createPanelContent('Right Sidebar');
    demo2Panel3Content.style.background = 'var(--bg-secondary)';
    demo2Panel3.appendChild(demo2Panel3Content);
    
    demo2Group.addPanel(demo2Panel1, 25);
    demo2Group.addHandle(demo2Handle1);
    demo2Group.addPanel(demo2Panel2, 50);
    demo2Group.addHandle(demo2Handle2);
    demo2Group.addPanel(demo2Panel3, 25);
    
    // Update size indicators
    const updateDemo2Sizes = () => {
      const sizes = demo2Group.getSizes();
      demo2Panel1Content.querySelector('.panel-size-indicator').textContent = `${sizes[0].toFixed(1)}%`;
      demo2Panel2Content.querySelector('.panel-size-indicator').textContent = `${sizes[1].toFixed(1)}%`;
      demo2Panel3Content.querySelector('.panel-size-indicator').textContent = `${sizes[2].toFixed(1)}%`;
    };
    updateDemo2Sizes();
    
    demo2Panel1.addEventListener('panelresize', updateDemo2Sizes);
    demo2Panel2.addEventListener('panelresize', updateDemo2Sizes);
    demo2Panel3.addEventListener('panelresize', updateDemo2Sizes);
    
    demo2Section.appendChild(demo2Group);
    container.appendChild(demo2Section);

    // Demo 3: Vertical Layout
    const demo3Section = createDemoSection('Vertical Layout', 'Vertically stacked resizable panels');
    
    const demo3Group = window.createResizablePanelGroup({ 
      direction: 'vertical',
      id: 'demo3Group'
    });
    demo3Group.style.cssText = 'height: 300px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;';
    
    const demo3Panel1 = window.createResizablePanel({ 
      defaultSize: 40, 
      minSize: 25, 
      maxSize: 60,
      id: 'demo3Panel1'
    });
    const demo3Panel1Content = createPanelContent('Header / Toolbar');
    demo3Panel1Content.style.background = 'var(--bg-secondary)';
    demo3Panel1.appendChild(demo3Panel1Content);
    
    const demo3Handle = window.createResizableHandle({ withHandle: true });
    demo3Handle.setAttribute('data-direction', 'vertical');
    
    const demo3Panel2 = window.createResizablePanel({ 
      defaultSize: 60, 
      minSize: 40, 
      maxSize: 75,
      id: 'demo3Panel2'
    });
    const demo3Panel2Content = createPanelContent('Main Content Area');
    demo3Panel2Content.style.background = 'var(--bg-primary)';
    demo3Panel2.appendChild(demo3Panel2Content);
    
    demo3Group.addPanel(demo3Panel1, 40);
    demo3Group.addHandle(demo3Handle);
    demo3Group.addPanel(demo3Panel2, 60);
    
    // Update size indicators
    const updateDemo3Sizes = () => {
      const sizes = demo3Group.getSizes();
      demo3Panel1Content.querySelector('.panel-size-indicator').textContent = `${sizes[0].toFixed(1)}%`;
      demo3Panel2Content.querySelector('.panel-size-indicator').textContent = `${sizes[1].toFixed(1)}%`;
    };
    updateDemo3Sizes();
    
    demo3Panel1.addEventListener('panelresize', updateDemo3Sizes);
    demo3Panel2.addEventListener('panelresize', updateDemo3Sizes);
    
    demo3Section.appendChild(demo3Group);
    container.appendChild(demo3Section);

    // Demo 4: Nested Layout (Horizontal + Vertical)
    const demo4Section = createDemoSection('Nested Layout', 'Combined horizontal and vertical panels');
    
    const demo4OuterGroup = window.createResizablePanelGroup({ 
      direction: 'horizontal',
      id: 'demo4OuterGroup'
    });
    demo4OuterGroup.style.cssText = 'height: 300px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;';
    
    // Left panel
    const demo4LeftPanel = window.createResizablePanel({ 
      defaultSize: 30, 
      minSize: 20, 
      maxSize: 40,
      id: 'demo4LeftPanel'
    });
    const demo4LeftContent = createPanelContent('Sidebar', false);
    demo4LeftContent.style.background = 'var(--bg-secondary)';
    demo4LeftPanel.appendChild(demo4LeftContent);
    
    const demo4OuterHandle = window.createResizableHandle({ withHandle: true });
    
    // Right side - nested vertical group
    const demo4RightPanel = window.createResizablePanel({ 
      defaultSize: 70,
      minSize: 60,
      maxSize: 80,
      id: 'demo4RightPanel'
    });
    
    const demo4InnerGroup = window.createResizablePanelGroup({ 
      direction: 'vertical',
      id: 'demo4InnerGroup'
    });
    demo4InnerGroup.style.cssText = 'height: 100%;';
    
    const demo4TopPanel = window.createResizablePanel({ 
      defaultSize: 50,
      minSize: 30,
      maxSize: 70,
      id: 'demo4TopPanel'
    });
    const demo4TopContent = createPanelContent('Top Content', false);
    demo4TopContent.style.background = 'var(--bg-primary)';
    demo4TopPanel.appendChild(demo4TopContent);
    
    const demo4InnerHandle = window.createResizableHandle({ withHandle: true });
    demo4InnerHandle.setAttribute('data-direction', 'vertical');
    
    const demo4BottomPanel = window.createResizablePanel({ 
      defaultSize: 50,
      minSize: 30,
      maxSize: 70,
      id: 'demo4BottomPanel'
    });
    const demo4BottomContent = createPanelContent('Bottom Content', false);
    demo4BottomContent.style.background = 'var(--bg-hover)';
    demo4BottomPanel.appendChild(demo4BottomContent);
    
    demo4InnerGroup.addPanel(demo4TopPanel, 50);
    demo4InnerGroup.addHandle(demo4InnerHandle);
    demo4InnerGroup.addPanel(demo4BottomPanel, 50);
    
    demo4RightPanel.appendChild(demo4InnerGroup);
    
    demo4OuterGroup.addPanel(demo4LeftPanel, 30);
    demo4OuterGroup.addHandle(demo4OuterHandle);
    demo4OuterGroup.addPanel(demo4RightPanel, 70);
    
    demo4Section.appendChild(demo4OuterGroup);
    container.appendChild(demo4Section);

    console.log('Resizable demos initialized successfully');
  }
})();

// ===== Select Component =====
/**
 * Creates a select dropdown element
 * @param {Object} options - Configuration options
 * @param {string} [options.placeholder='Select...'] - Placeholder text when no value selected
 * @param {string} [options.value] - Initial selected value
 * @param {Function} [options.onValueChange] - Callback when value changes
 * @param {boolean} [options.disabled=false] - Whether select is disabled
 * @param {string} [options.className=''] - Additional CSS classes
 * @returns {HTMLElement} The select container element
 */
window.createSelect = function(options = {}) {
  const {
    placeholder = 'Select...',
    value,
    onValueChange,
    disabled = false,
    className = ''
  } = options;

  const container = document.createElement('div');
  container.className = `select-container ${className}`.trim();

  const trigger = document.createElement('button');
  trigger.className = 'select-trigger';
  trigger.setAttribute('type', 'button');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  if (disabled) trigger.disabled = true;

  const triggerValue = document.createElement('span');
  triggerValue.className = 'select-trigger-value';
  triggerValue.textContent = placeholder;
  if (value) triggerValue.classList.add('select-trigger-placeholder');

  const triggerIcon = document.createElement('span');
  triggerIcon.className = 'select-trigger-icon';
  triggerIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';

  trigger.appendChild(triggerValue);
  trigger.appendChild(triggerIcon);
  container.appendChild(trigger);

  const content = document.createElement('div');
  content.className = 'select-content';
  content.setAttribute('role', 'listbox');
  content.style.display = 'none';
  content.setAttribute('data-side', 'bottom');

  const scrollUpButton = document.createElement('button');
  scrollUpButton.className = 'select-scroll-button';
  scrollUpButton.setAttribute('type', 'button');
  scrollUpButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>';
  scrollUpButton.style.display = 'none';

  const viewport = document.createElement('div');
  viewport.className = 'select-viewport';
  viewport.setAttribute('role', 'document');

  const scrollDownButton = document.createElement('button');
  scrollDownButton.className = 'select-scroll-button';
  scrollDownButton.setAttribute('type', 'button');
  scrollDownButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  scrollDownButton.style.display = 'none';

  content.appendChild(scrollUpButton);
  content.appendChild(viewport);
  content.appendChild(scrollDownButton);
  container.appendChild(content);

  // Internal state
  let isOpen = false;
  let selectedValue = value;
  let selectedItemElement = null;
  let items = [];
  let focusedIndex = -1;

  // Show/hide content
  const open = () => {
    if (disabled) return;
    isOpen = true;
    content.style.display = 'flex';
    trigger.setAttribute('aria-expanded', 'true');
    
    // Position dropdown
    setTimeout(() => {
      const triggerRect = trigger.getBoundingClientRect();
      const contentHeight = content.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      if (triggerRect.bottom + contentHeight > viewportHeight && triggerRect.top > contentHeight) {
        content.setAttribute('data-side', 'top');
      } else {
        content.setAttribute('data-side', 'bottom');
      }
    }, 0);

    focusedIndex = items.findIndex(item => item.getAttribute('data-selected') === 'true');
    if (focusedIndex === -1) focusedIndex = 0;
    updateFocus();
  };

  const close = () => {
    isOpen = false;
    content.style.display = 'none';
    trigger.setAttribute('aria-expanded', 'false');
    focusedIndex = -1;
  };

  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  // Update scroll button visibility
  const updateScrollButtons = () => {
    const canScrollUp = viewport.scrollTop > 0;
    const canScrollDown = viewport.scrollTop < viewport.scrollHeight - viewport.clientHeight;
    
    scrollUpButton.style.display = canScrollUp ? 'flex' : 'none';
    scrollDownButton.style.display = canScrollDown ? 'flex' : 'none';
  };

  // Focus management
  const updateFocus = () => {
    items.forEach((item, index) => {
      if (index === focusedIndex) {
        item.style.background = 'var(--bg-secondary)';
        item.scrollIntoView({ block: 'nearest' });
      } else if (item.getAttribute('data-selected') !== 'true') {
        item.style.background = '';
      }
    });
  };

  // Handle item selection
  const selectItem = (itemElement) => {
    const itemValue = itemElement.getAttribute('data-value');
    const itemLabel = itemElement.textContent;

    // Remove previous selection
    if (selectedItemElement) {
      selectedItemElement.setAttribute('data-selected', 'false');
      selectedItemElement.style.background = '';
    }

    // Set new selection
    selectedValue = itemValue;
    selectedItemElement = itemElement;
    itemElement.setAttribute('data-selected', 'true');
    itemElement.style.background = 'rgba(29, 78, 216, 0.08)';
    
    triggerValue.textContent = itemLabel;
    triggerValue.classList.remove('select-trigger-placeholder');

    if (onValueChange) {
      onValueChange(itemValue, itemLabel);
    }

    close();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        open();
      }
      return;
    }

    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
        updateFocus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusedIndex = Math.max(focusedIndex - 1, 0);
        updateFocus();
        break;
      case 'Home':
        e.preventDefault();
        focusedIndex = 0;
        updateFocus();
        break;
      case 'End':
        e.preventDefault();
        focusedIndex = items.length - 1;
        updateFocus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          selectItem(items[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        trigger.focus();
        break;
    }
  };

  // Trigger click
  trigger.addEventListener('click', toggle);
  trigger.addEventListener('keydown', handleKeyDown);

  // Scroll buttons
  scrollUpButton.addEventListener('click', () => {
    viewport.scrollTop -= 40;
    updateScrollButtons();
  });

  scrollDownButton.addEventListener('click', () => {
    viewport.scrollTop += 40;
    updateScrollButtons();
  });

  viewport.addEventListener('scroll', updateScrollButtons);

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && isOpen) {
      close();
    }
  });

  // Public API
  container.addItem = function(value, label, disabled = false) {
    const item = document.createElement('div');
    item.className = 'select-item';
    item.setAttribute('role', 'option');
    item.setAttribute('data-value', value);
    item.setAttribute('data-selected', value === selectedValue ? 'true' : 'false');
    item.setAttribute('data-disabled', disabled ? 'true' : 'false');

    const indicator = document.createElement('div');
    indicator.className = 'select-item-indicator';
    indicator.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    const label_el = document.createElement('div');
    label_el.textContent = label;

    item.appendChild(indicator);
    item.appendChild(label_el);

    if (!disabled) {
      item.addEventListener('click', () => selectItem(item));
      item.addEventListener('mouseenter', () => {
        focusedIndex = items.length;
      });
    } else {
      item.style.opacity = '0.5';
      item.style.cursor = 'not-allowed';
    }

    viewport.appendChild(item);
    items.push(item);

    if (value === selectedValue) {
      selectedItemElement = item;
      triggerValue.textContent = label;
      triggerValue.classList.remove('select-trigger-placeholder');
    }

    return this;
  };

  container.addLabel = function(text) {
    const label = document.createElement('div');
    label.className = 'select-label';
    label.textContent = text;
    viewport.appendChild(label);
    return this;
  };

  container.addSeparator = function() {
    const separator = document.createElement('div');
    separator.className = 'select-separator';
    viewport.appendChild(separator);
    return this;
  };

  container.setValue = function(val) {
    const item = items.find(i => i.getAttribute('data-value') === val);
    if (item) {
      selectItem(item);
    }
    return this;
  };

  container.getValue = function() {
    return selectedValue;
  };

  container.open = open;
  container.close = close;

  return container;
};

// ===== Initialize ScrollArea Demo =====
(function initScrollAreaDemo() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupScrollAreaDemo);
  } else {
    setupScrollAreaDemo();
  }

  function setupScrollAreaDemo() {
    const container = document.getElementById('scrollAreaDemoContainer');
    if (!container) return;

    // Demo 1: Vertical scrollable list
    const demo1 = document.createElement('div');
    demo1.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    const demo1Title = document.createElement('div');
    demo1Title.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
    demo1Title.textContent = 'Vertical Scroll - Messages List';
    demo1.appendChild(demo1Title);

    const scrollArea1 = window.createScrollArea({ id: 'verticalScrollDemo' });
    scrollArea1.style.cssText = 'height: 200px; width: 100%;';

    const content1 = scrollArea1.getContent();
    content1.style.padding = '12px';

    // Add 20 messages
    for (let i = 1; i <= 20; i++) {
      const message = document.createElement('div');
      message.style.cssText = `
        padding: 12px;
        margin-bottom: 8px;
        background: var(--bg-primary);
        border-radius: 6px;
        border-left: 3px solid ${i % 2 === 0 ? 'var(--brand-color)' : 'var(--border-color)'};
        font-size: 0.875rem;
        color: var(--text-primary);
      `;
      message.textContent = `Message #${i}: This is a sample message for the scrollable area demo.`;
      content1.appendChild(message);
    }

    demo1.appendChild(scrollArea1);
    container.appendChild(demo1);

    // Demo 2: Horizontal scrollable content
    const demo2 = document.createElement('div');
    demo2.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    const demo2Title = document.createElement('div');
    demo2Title.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
    demo2Title.textContent = 'Horizontal Scroll - Image Gallery';
    demo2.appendChild(demo2Title);

    const scrollArea2 = window.createScrollArea({ id: 'horizontalScrollDemo' });
    scrollArea2.style.cssText = 'height: 160px; width: 100%;';

    const content2 = scrollArea2.getContent();
    content2.style.cssText = 'display: flex; gap: 12px; padding: 12px; width: max-content;';

    // Add 12 items
    for (let i = 1; i <= 12; i++) {
      const item = document.createElement('div');
      item.style.cssText = `
        min-width: 120px;
        height: 120px;
        background: linear-gradient(135deg, ${['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'][i % 5]} 0%, ${['#1E3A8A', '#6D28D9', '#831843', '#92400E', '#065F46'][i % 5]} 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      item.textContent = `Item ${i}`;
      item.onmouseover = () => item.style.transform = 'scale(1.05)';
      item.onmouseout = () => item.style.transform = 'scale(1)';
      content2.appendChild(item);
    }

    demo2.appendChild(scrollArea2);
    container.appendChild(demo2);

    // Demo 3: Vertical scroll with code/data display
    const demo3 = document.createElement('div');
    demo3.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    const demo3Title = document.createElement('div');
    demo3Title.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
    demo3Title.textContent = 'Vertical Scroll - Data Table';
    demo3.appendChild(demo3Title);

    const scrollArea3 = window.createScrollArea({ id: 'tableScrollDemo' });
    scrollArea3.style.cssText = 'height: 220px; width: 100%;';

    const content3 = scrollArea3.getContent();
    content3.style.cssText = 'padding: 0; font-family: monospace; font-size: 0.8rem;';

    // Add table rows
    const headers = ['ID', 'Name', 'Status', 'Date'];
    const headerRow = document.createElement('div');
    headerRow.style.cssText = `
      display: grid;
      grid-template-columns: 50px 1fr 100px 120px;
      gap: 12px;
      padding: 12px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      font-weight: 600;
      color: var(--text-primary);
    `;
    headers.forEach(h => {
      const cell = document.createElement('div');
      cell.textContent = h;
      headerRow.appendChild(cell);
    });
    content3.appendChild(headerRow);

    const statuses = ['Active', 'Pending', 'Complete', 'Failed'];
    for (let i = 1; i <= 15; i++) {
      const row = document.createElement('div');
      row.style.cssText = `
        display: grid;
        grid-template-columns: 50px 1fr 100px 120px;
        gap: 12px;
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
        background: ${i % 2 === 0 ? 'var(--bg-primary)' : 'transparent'};
        color: var(--text-primary);
        align-items: center;
      `;

      const statusColor = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'][i % 4];
      
      const idCell = document.createElement('div');
      idCell.textContent = `${1001 + i}`;
      
      const nameCell = document.createElement('div');
      nameCell.textContent = `Item ${i}`;
      
      const statusCell = document.createElement('div');
      statusCell.style.cssText = `
        color: ${statusColor};
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        background: ${statusColor}15;
        text-align: center;
      `;
      statusCell.textContent = statuses[i % 4];
      
      const dateCell = document.createElement('div');
      const date = new Date();
      date.setDate(date.getDate() - (15 - i));
      dateCell.textContent = date.toLocaleDateString();
      
      row.appendChild(idCell);
      row.appendChild(nameCell);
      row.appendChild(statusCell);
      row.appendChild(dateCell);
      
      content3.appendChild(row);
    }

    demo3.appendChild(scrollArea3);
    container.appendChild(demo3);

    // Demo 4: Both vertical and horizontal scroll
    const demo4 = document.createElement('div');
    demo4.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    const demo4Title = document.createElement('div');
    demo4Title.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
    demo4Title.textContent = 'Both Axis Scroll - Large Data Grid';
    demo4.appendChild(demo4Title);

    const scrollArea4 = window.createScrollArea({ id: 'gridScrollDemo' });
    scrollArea4.style.cssText = 'height: 200px; width: 100%;';

    const content4 = scrollArea4.getContent();
    content4.style.cssText = 'padding: 0; font-family: monospace; font-size: 0.8rem;';

    // Create a large grid
    for (let row = 0; row < 20; row++) {
      const rowEl = document.createElement('div');
      rowEl.style.cssText = `
        display: flex;
        border-bottom: 1px solid var(--border-color);
        background: ${row % 2 === 0 ? 'var(--bg-primary)' : 'transparent'};
      `;

      for (let col = 0; col < 15; col++) {
        const cell = document.createElement('div');
        cell.style.cssText = `
          padding: 8px 12px;
          border-right: 1px solid var(--border-color);
          color: var(--text-primary);
          min-width: 80px;
          text-align: center;
          white-space: nowrap;
        `;
        cell.textContent = `R${row}C${col}`;
        rowEl.appendChild(cell);
      }

      content4.appendChild(rowEl);
    }

    demo4.appendChild(scrollArea4);
    container.appendChild(demo4);

    console.log('ScrollArea demos initialized successfully');
  }
})();

// ===== Separator Component =====
/**
 * Creates a separator (divider line) element
 * @param {Object} options - Configuration options
 * @param {string} [options.orientation='horizontal'] - Direction: 'horizontal' or 'vertical'
 * @param {boolean} [options.decorative=true] - Whether separator is purely decorative (accessibility)
 * @param {string} [options.className=''] - Additional CSS classes
 * @param {string} [options.id] - Optional ID for the separator
 * @returns {HTMLElement} The separator element
 */
window.createSeparator = function(options = {}) {
  const {
    orientation = 'horizontal',
    decorative = true,
    className = '',
    id
  } = options;

  const separator = document.createElement('div');
  separator.className = `separator ${className}`.trim();
  if (id) separator.id = id;
  
  separator.setAttribute('data-orientation', orientation);
  separator.setAttribute('data-decorative', decorative);
  
  if (decorative) {
    separator.setAttribute('role', 'none');
    separator.setAttribute('aria-hidden', 'true');
  } else {
    separator.setAttribute('role', 'separator');
    separator.setAttribute('aria-orientation', orientation === 'horizontal' ? 'horizontal' : 'vertical');
  }

  return separator;
};

// ===== Initialize Select Demo =====
(function initSelectDemo() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSelectDemo);
  } else {
    setupSelectDemo();
  }

  function setupSelectDemo() {
    const container = document.getElementById('selectDemoContainer');
    if (!container) return;

    // Demo 1: Basic select with countries
    const demo1 = document.createElement('div');
    demo1.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    const demo1Label = document.createElement('label');
    demo1Label.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
    demo1Label.textContent = 'Select a Country';
    demo1.appendChild(demo1Label);

    const select1 = window.createSelect({
      placeholder: 'Choose a country...',
      onValueChange: (value, label) => {
        demo1Result.textContent = `Selected: ${label}`;
      }
    });
    select1.style.maxWidth = '280px';

    select1.addItem('us', '🇺🇸 United States');
    select1.addItem('uk', '🇬🇧 United Kingdom');
    select1.addItem('ca', '🇨🇦 Canada');
    select1.addItem('au', '🇦🇺 Australia');
    select1.addItem('de', '🇩🇪 Germany');
    select1.addItem('fr', '🇫🇷 France');
    select1.addItem('jp', '🇯🇵 Japan');
    select1.addItem('in', '🇮🇳 India');
    select1.addItem('br', '🇧🇷 Brazil');
    select1.addItem('mx', '🇲🇽 Mexico');

    demo1.appendChild(select1);

    const demo1Result = document.createElement('div');
    demo1Result.textContent = 'Selected: None';
    demo1Result.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;';
    demo1.appendChild(demo1Result);

    container.appendChild(demo1);

    // Demo 2: Select with labels and separators
    const demo2 = document.createElement('div');
    demo2.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    const demo2Label = document.createElement('label');
    demo2Label.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
    demo2Label.textContent = 'Select a Framework';
    demo2.appendChild(demo2Label);

    const select2 = window.createSelect({
      placeholder: 'Choose a framework...',
      value: 'react',
      onValueChange: (value, label) => {
        demo2Result.textContent = `Selected: ${label}`;
      }
    });
    select2.style.maxWidth = '280px';

    select2.addLabel('Frontend');
    select2.addItem('react', 'React');
    select2.addItem('vue', 'Vue.js');
    select2.addItem('angular', 'Angular');
    select2.addItem('svelte', 'Svelte');
    select2.addSeparator();
    select2.addLabel('Backend');
    select2.addItem('nodejs', 'Node.js');
    select2.addItem('python', 'Python/Django');
    select2.addItem('java', 'Java');
    select2.addItem('go', 'Go');

    demo2.appendChild(select2);

    const demo2Result = document.createElement('div');
    demo2Result.textContent = 'Selected: React';
    demo2Result.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;';
    demo2.appendChild(demo2Result);

    container.appendChild(demo2);

    // Demo 3: Select with disabled items
    const demo3 = document.createElement('div');
    demo3.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    const demo3Label = document.createElement('label');
    demo3Label.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
    demo3Label.textContent = 'Select a License Type';
    demo3.appendChild(demo3Label);

    const select3 = window.createSelect({
      placeholder: 'Choose a license...',
      onValueChange: (value, label) => {
        demo3Result.textContent = `Selected: ${label}`;
      }
    });
    select3.style.maxWidth = '280px';

    select3.addItem('free', '📦 Free (Community)');
    select3.addItem('pro', '⭐ Pro - $99/year');
    select3.addItem('enterprise', '🏢 Enterprise (Custom)');
    select3.addItem('legacy', 'Legacy Support', true); // disabled
    select3.addItem('beta', 'Beta Features', true); // disabled

    demo3.appendChild(select3);

    const demo3Result = document.createElement('div');
    demo3Result.textContent = 'Selected: None';
    demo3Result.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;';
    demo3.appendChild(demo3Result);

    container.appendChild(demo3);

    // Demo 4: Multiple selects for form
    const demo4 = document.createElement('div');
    demo4.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

    const demo4Title = document.createElement('div');
    demo4Title.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem; margin-bottom: 8px;';
    demo4Title.textContent = 'User Registration Form';
    demo4.appendChild(demo4Title);

    // Role select
    const roleContainer = document.createElement('div');
    roleContainer.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    const roleLabel = document.createElement('label');
    roleLabel.style.cssText = 'font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;';
    roleLabel.textContent = 'Role';
    roleContainer.appendChild(roleLabel);

    const roleSelect = window.createSelect({
      placeholder: 'Select role...',
      onValueChange: (value) => {
        formResult.textContent = `Role: ${value} | Department: ${deptSelect.getValue() || 'None'} | Level: ${levelSelect.getValue() || 'None'}`;
      }
    });
    roleSelect.style.maxWidth = '100%';
    roleSelect.addItem('admin', 'Administrator');
    roleSelect.addItem('manager', 'Manager');
    roleSelect.addItem('developer', 'Developer');
    roleSelect.addItem('designer', 'Designer');
    roleContainer.appendChild(roleSelect);
    demo4.appendChild(roleContainer);

    // Department select
    const deptContainer = document.createElement('div');
    deptContainer.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    const deptLabel = document.createElement('label');
    deptLabel.style.cssText = 'font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;';
    deptLabel.textContent = 'Department';
    deptContainer.appendChild(deptLabel);

    const deptSelect = window.createSelect({
      placeholder: 'Select department...',
      onValueChange: (value) => {
        formResult.textContent = `Role: ${roleSelect.getValue() || 'None'} | Department: ${value} | Level: ${levelSelect.getValue() || 'None'}`;
      }
    });
    deptSelect.style.maxWidth = '100%';
    deptSelect.addItem('engineering', 'Engineering');
    deptSelect.addItem('marketing', 'Marketing');
    deptSelect.addItem('sales', 'Sales');
    deptSelect.addItem('hr', 'Human Resources');
    deptSelect.addItem('finance', 'Finance');
    deptContainer.appendChild(deptSelect);
    demo4.appendChild(deptContainer);

    // Level select
    const levelContainer = document.createElement('div');
    levelContainer.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

    const levelLabel = document.createElement('label');
    levelLabel.style.cssText = 'font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;';
    levelLabel.textContent = 'Experience Level';
    levelContainer.appendChild(levelLabel);

    const levelSelect = window.createSelect({
      placeholder: 'Select level...',
      onValueChange: (value) => {
        formResult.textContent = `Role: ${roleSelect.getValue() || 'None'} | Department: ${deptSelect.getValue() || 'None'} | Level: ${value}`;
      }
    });
    levelSelect.style.maxWidth = '100%';
    levelSelect.addItem('junior', 'Junior (0-2 years)');
    levelSelect.addItem('mid', 'Mid-level (2-5 years)');
    levelSelect.addItem('senior', 'Senior (5-10 years)');
    levelSelect.addItem('lead', 'Lead (10+ years)');
    levelContainer.appendChild(levelSelect);
    demo4.appendChild(levelContainer);

    const formResult = document.createElement('div');
    formResult.textContent = 'Role: None | Department: None | Level: None';
    formResult.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); margin-top: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 4px;';
    demo4.appendChild(formResult);

    container.appendChild(demo4);

    console.log('Select demos initialized successfully');
  }
})();

// ===== Sheet Component =====
/**
 * Creates a sheet (slide-in panel) with overlay
 * @param {Object} options - Configuration options
 * @param {string} [options.side='right'] - Side to slide from: 'top', 'bottom', 'left', 'right'
 * @param {Function} [options.onClose] - Callback when sheet closes
 * @param {string} [options.className=''] - Additional CSS classes
 * @returns {Object} Sheet controller object
 */
window.createSheet = function(options = {}) {
  const {
    side = 'right',
    onClose,
    className = ''
  } = options;

  let isOpen = false;
  let overlay = null;
  let content = null;

  // Create overlay
  const createOverlay = () => {
    overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    overlay.setAttribute('data-state', 'open');
    
    overlay.addEventListener('click', () => {
      close();
    });
    
    return overlay;
  };

  // Create content
  const createContent = () => {
    content = document.createElement('div');
    content.className = `sheet-content ${className}`.trim();
    content.setAttribute('data-side', side);
    content.setAttribute('data-state', 'closed');
    content.setAttribute('role', 'dialog');
    content.setAttribute('aria-modal', 'true');

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'sheet-close';
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
    
    content.appendChild(closeButton);
    
    return content;
  };

  // Open sheet
  const open = () => {
    if (isOpen) return;
    isOpen = true;

    // Create and append overlay
    overlay = createOverlay();
    document.body.appendChild(overlay);

    // Create and append content
    content = createContent();
    document.body.appendChild(content);

    // Trigger animation
    setTimeout(() => {
      content.setAttribute('data-state', 'open');
    }, 10);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // ESC key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', handleEscape);
    content._escapeHandler = handleEscape;
  };

  // Close sheet
  const close = () => {
    if (!isOpen) return;
    isOpen = false;

    // Start closing animation
    if (overlay) {
      overlay.setAttribute('data-state', 'closing');
    }
    if (content) {
      content.setAttribute('data-state', 'closing');
    }

    // Wait for animation to complete
    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      if (content && content.parentNode) {
        content.parentNode.removeChild(content);
      }
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Remove escape handler
      if (content && content._escapeHandler) {
        document.removeEventListener('keydown', content._escapeHandler);
      }
      
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  // Create header
  const createHeader = (title, description) => {
    const header = document.createElement('div');
    header.className = 'sheet-header';

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'sheet-title';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    if (description) {
      const descEl = document.createElement('div');
      descEl.className = 'sheet-description';
      descEl.textContent = description;
      header.appendChild(descEl);
    }

    return header;
  };

  // Create footer
  const createFooter = () => {
    const footer = document.createElement('div');
    footer.className = 'sheet-footer';
    return footer;
  };

  // Public API
  return {
    open,
    close,
    isOpen: () => isOpen,
    getContent: () => content,
    setHeader: (title, description) => {
      if (!content) return;
      
      // Remove existing header
      const existingHeader = content.querySelector('.sheet-header');
      if (existingHeader) {
        existingHeader.remove();
      }
      
      // Add new header after close button
      const closeBtn = content.querySelector('.sheet-close');
      const header = createHeader(title, description);
      if (closeBtn && closeBtn.nextSibling) {
        content.insertBefore(header, closeBtn.nextSibling);
      } else {
        content.appendChild(header);
      }
    },
    setContent: (contentHTML) => {
      if (!content) return;
      
      // Find or create content area
      let contentArea = content.querySelector('.sheet-body');
      if (!contentArea) {
        contentArea = document.createElement('div');
        contentArea.className = 'sheet-body';
        contentArea.style.cssText = 'flex: 1; overflow: auto;';
        
        const footer = content.querySelector('.sheet-footer');
        if (footer) {
          content.insertBefore(contentArea, footer);
        } else {
          content.appendChild(contentArea);
        }
      }
      
      if (typeof contentHTML === 'string') {
        contentArea.innerHTML = contentHTML;
      } else {
        contentArea.innerHTML = '';
        contentArea.appendChild(contentHTML);
      }
    },
    setFooter: (buttons) => {
      if (!content) return;
      
      // Remove existing footer
      const existingFooter = content.querySelector('.sheet-footer');
      if (existingFooter) {
        existingFooter.remove();
      }
      
      // Create and append new footer
      const footer = createFooter();
      buttons.forEach(btn => footer.appendChild(btn));
      content.appendChild(footer);
    }
  };
};

// ===== Initialize Separator Demo =====
(function initSeparatorDemo() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSeparatorDemo);
  } else {
    setupSeparatorDemo();
  }

  function setupSeparatorDemo() {
    const container = document.getElementById('separatorDemoContainer');
    if (!container) return;

    // Demo 1: Horizontal separators with text
    const demo1 = document.createElement('div');
    demo1.style.cssText = 'display: flex; flex-direction: column; gap: 0;';

    const item1 = document.createElement('div');
    item1.style.cssText = 'padding: 12px 0; color: var(--text-primary); font-size: 0.875rem;';
    item1.textContent = 'Section 1 - Header';
    demo1.appendChild(item1);

    const sep1 = window.createSeparator({ orientation: 'horizontal' });
    sep1.style.margin = '0';
    demo1.appendChild(sep1);

    const item2 = document.createElement('div');
    item2.style.cssText = 'padding: 12px 0; color: var(--text-primary); font-size: 0.875rem;';
    item2.textContent = 'Section 2 - Content';
    demo1.appendChild(item2);

    const sep2 = window.createSeparator({ orientation: 'horizontal' });
    sep2.style.margin = '0';
    demo1.appendChild(sep2);

    const item3 = document.createElement('div');
    item3.style.cssText = 'padding: 12px 0; color: var(--text-primary); font-size: 0.875rem;';
    item3.textContent = 'Section 3 - Footer';
    demo1.appendChild(item3);

    const demo1Container = document.createElement('div');
    demo1Container.style.cssText = 'background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 0 12px; overflow: hidden;';
    demo1Container.appendChild(demo1);
    container.appendChild(demo1Container);

    // Demo 2: Vertical separators in a row
    const demo2 = document.createElement('div');
    demo2.style.cssText = 'display: flex; align-items: center; gap: 0; height: 120px;';

    for (let i = 0; i < 5; i++) {
      if (i > 0) {
        const vertSep = window.createSeparator({ orientation: 'vertical' });
        vertSep.style.cssText = 'margin: 0; height: 80px;';
        demo2.appendChild(vertSep);
      }

      const content = document.createElement('div');
      content.style.cssText = 'flex: 1; padding: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;';
      
      const icon = document.createElement('div');
      icon.style.cssText = 'font-size: 24px; margin-bottom: 6px;';
      icon.textContent = ['🎯', '📊', '⚡', '🔧', '💡'][i];
      
      const label = document.createElement('div');
      label.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;';
      label.textContent = ['Analytics', 'Reports', 'Performance', 'Settings', 'Ideas'][i];
      
      content.appendChild(icon);
      content.appendChild(label);
      demo2.appendChild(content);
    }

    const demo2Container = document.createElement('div');
    demo2Container.style.cssText = 'background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden;';
    demo2Container.appendChild(demo2);
    container.appendChild(demo2Container);

    // Demo 3: Card layout with separators
    const demo3 = document.createElement('div');
    demo3.style.cssText = 'display: flex; flex-direction: column; gap: 0;';

    const cardHeader = document.createElement('div');
    cardHeader.style.cssText = 'padding: 16px; background: var(--bg-secondary);';
    
    const cardTitle = document.createElement('div');
    cardTitle.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
    cardTitle.textContent = 'User Profile';
    cardHeader.appendChild(cardTitle);
    demo3.appendChild(cardHeader);

    const sep3 = window.createSeparator({ orientation: 'horizontal' });
    sep3.style.margin = '0';
    demo3.appendChild(sep3);

    const cardContent = document.createElement('div');
    cardContent.style.cssText = 'padding: 16px;';
    
    const profileField = document.createElement('div');
    profileField.style.cssText = 'margin-bottom: 12px;';
    
    const fieldLabel = document.createElement('div');
    fieldLabel.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;';
    fieldLabel.textContent = 'Email';
    
    const fieldValue = document.createElement('div');
    fieldValue.style.cssText = 'color: var(--text-primary); font-size: 0.875rem;';
    fieldValue.textContent = 'user@example.com';
    
    profileField.appendChild(fieldLabel);
    profileField.appendChild(fieldValue);
    cardContent.appendChild(profileField);

    const sep3b = window.createSeparator({ orientation: 'horizontal' });
    sep3b.style.cssText = 'margin: 12px 0;';
    cardContent.appendChild(sep3b);

    const profileField2 = document.createElement('div');
    profileField2.style.cssText = 'margin-bottom: 12px;';
    
    const fieldLabel2 = document.createElement('div');
    fieldLabel2.style.cssText = 'font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;';
    fieldLabel2.textContent = 'Joined';
    
    const fieldValue2 = document.createElement('div');
    fieldValue2.style.cssText = 'color: var(--text-primary); font-size: 0.875rem;';
    fieldValue2.textContent = 'January 27, 2026';
    
    profileField2.appendChild(fieldLabel2);
    profileField2.appendChild(fieldValue2);
    cardContent.appendChild(profileField2);

    demo3.appendChild(cardContent);

    const sep4 = window.createSeparator({ orientation: 'horizontal' });
    sep4.style.margin = '0';
    demo3.appendChild(sep4);

    const cardFooter = document.createElement('div');
    cardFooter.style.cssText = 'padding: 12px 16px; background: var(--bg-secondary); display: flex; gap: 8px;';
    
    const editBtn = document.createElement('button');
    editBtn.style.cssText = 'flex: 1; padding: 6px 12px; background: var(--brand-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500;';
    editBtn.textContent = 'Edit';
    cardFooter.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.style.cssText = 'flex: 1; padding: 6px 12px; background: transparent; color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; font-size: 0.875rem; font-weight: 500;';
    deleteBtn.textContent = 'Delete';
    cardFooter.appendChild(deleteBtn);

    demo3.appendChild(cardFooter);

    const demo3Container = document.createElement('div');
    demo3Container.style.cssText = 'background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; max-width: 300px;';
    demo3Container.appendChild(demo3);
    container.appendChild(demo3Container);

    // Demo 4: Mixed separators in flexible layout
    const demo4 = document.createElement('div');
    demo4.style.cssText = 'display: grid; grid-template-columns: 1fr 1px 1fr; gap: 0; height: 160px;';

    const leftColumn = document.createElement('div');
    leftColumn.style.cssText = 'padding: 16px; display: flex; flex-direction: column; gap: 12px;';

    const leftTitle = document.createElement('div');
    leftTitle.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
    leftTitle.textContent = 'Features';
    leftColumn.appendChild(leftTitle);

    for (let feature of ['✓ Fast', '✓ Reliable', '✓ Secure']) {
      const featureItem = document.createElement('div');
      featureItem.style.cssText = 'font-size: 0.875rem; color: var(--text-secondary);';
      featureItem.textContent = feature;
      leftColumn.appendChild(featureItem);
    }

    demo4.appendChild(leftColumn);

    const verticalSep = window.createSeparator({ orientation: 'vertical' });
    demo4.appendChild(verticalSep);

    const rightColumn = document.createElement('div');
    rightColumn.style.cssText = 'padding: 16px; display: flex; flex-direction: column; gap: 12px;';

    const rightTitle = document.createElement('div');
    rightTitle.style.cssText = 'font-weight: 600; color: var(--text-primary); font-size: 0.875rem;';
    rightTitle.textContent = 'Benefits';
    rightColumn.appendChild(rightTitle);

    for (let benefit of ['💰 Cost-effective', '⚡ High Performance', '🎯 User-friendly']) {
      const benefitItem = document.createElement('div');
      benefitItem.style.cssText = 'font-size: 0.875rem; color: var(--text-secondary);';
      benefitItem.textContent = benefit;
      rightColumn.appendChild(benefitItem);
    }

    demo4.appendChild(rightColumn);

    const demo4Container = document.createElement('div');
    demo4Container.style.cssText = 'background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden;';
    demo4Container.appendChild(demo4);
    container.appendChild(demo4Container);

    console.log('Separator demos initialized successfully');
  }
})();

// ===== Initialize Sheet Demo =====
(function initSheetDemo() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSheetDemo);
  } else {
    setupSheetDemo();
  }

  function setupSheetDemo() {
    const container = document.getElementById('sheetDemoContainer');
    if (!container) return;

    // Helper to create trigger button
    const createTriggerButton = (text, side) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        padding: 10px 20px;
        background: var(--brand-color);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.15s;
      `;
      btn.textContent = text;
      btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
      btn.onmouseout = () => btn.style.transform = 'scale(1)';
      return btn;
    };

    // Demo 1: Right side sheet (default)
    const rightBtn = createTriggerButton('Open from Right', 'right');
    const rightSheet = window.createSheet({ side: 'right' });
    
    rightBtn.addEventListener('click', () => {
      rightSheet.open();
      rightSheet.setHeader('Account Settings', 'Manage your account preferences and settings');
      
      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
      
      // Form fields
      const fields = [
        { label: 'Email', value: 'user@example.com', type: 'email' },
        { label: 'Username', value: 'johndoe', type: 'text' },
        { label: 'Display Name', value: 'John Doe', type: 'text' }
      ];
      
      fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';
        
        const label = document.createElement('label');
        label.style.cssText = 'font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;';
        label.textContent = field.label;
        
        const input = document.createElement('input');
        input.type = field.type;
        input.value = field.value;
        input.style.cssText = `
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 14px;
          background: var(--bg-primary);
          color: var(--text-primary);
        `;
        
        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        contentDiv.appendChild(fieldDiv);
      });
      
      rightSheet.setContent(contentDiv);
      
      // Footer buttons
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save Changes';
      saveBtn.style.cssText = `
        padding: 8px 16px;
        background: var(--brand-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      `;
      saveBtn.onclick = () => rightSheet.close();
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = `
        padding: 8px 16px;
        background: transparent;
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      `;
      cancelBtn.onclick = () => rightSheet.close();
      
      rightSheet.setFooter([cancelBtn, saveBtn]);
    });
    
    container.appendChild(rightBtn);

    // Demo 2: Left side sheet
    const leftBtn = createTriggerButton('Open from Left', 'left');
    const leftSheet = window.createSheet({ side: 'left' });
    
    leftBtn.addEventListener('click', () => {
      leftSheet.open();
      leftSheet.setHeader('Navigation Menu', 'Browse through the application sections');
      
      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
      
      const menuItems = [
        { icon: '🏠', label: 'Dashboard', badge: null },
        { icon: '📊', label: 'Analytics', badge: '12' },
        { icon: '👥', label: 'Users', badge: null },
        { icon: '⚙️', label: 'Settings', badge: null },
        { icon: '📄', label: 'Documents', badge: '3' },
        { icon: '💬', label: 'Messages', badge: '5' }
      ];
      
      menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.style.cssText = `
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
        `;
        menuItem.onmouseover = () => menuItem.style.background = 'var(--bg-secondary)';
        menuItem.onmouseout = () => menuItem.style.background = 'transparent';
        
        const icon = document.createElement('span');
        icon.style.cssText = 'font-size: 20px;';
        icon.textContent = item.icon;
        
        const label = document.createElement('span');
        label.style.cssText = 'flex: 1; font-size: 14px; font-weight: 500; color: var(--text-primary);';
        label.textContent = item.label;
        
        menuItem.appendChild(icon);
        menuItem.appendChild(label);
        
        if (item.badge) {
          const badge = document.createElement('span');
          badge.style.cssText = `
            background: var(--brand-color);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          `;
          badge.textContent = item.badge;
          menuItem.appendChild(badge);
        }
        
        contentDiv.appendChild(menuItem);
      });
      
      leftSheet.setContent(contentDiv);
    });
    
    container.appendChild(leftBtn);

    // Demo 3: Top sheet
    const topBtn = createTriggerButton('Open from Top', 'top');
    const topSheet = window.createSheet({ side: 'top' });
    
    topBtn.addEventListener('click', () => {
      topSheet.open();
      topSheet.setHeader('Notifications', 'Recent activity and updates');
      
      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;';
      
      const notifications = [
        { type: 'success', title: 'Payment Received', message: 'Your payment has been processed', time: '2 min ago' },
        { type: 'info', title: 'System Update', message: 'New features available', time: '1 hour ago' },
        { type: 'warning', title: 'Action Required', message: 'Please verify your email', time: '3 hours ago' }
      ];
      
      notifications.forEach(notif => {
        const card = document.createElement('div');
        card.style.cssText = `
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 6px;
          border-left: 3px solid ${notif.type === 'success' ? '#10B981' : notif.type === 'warning' ? '#F59E0B' : '#3B82F6'};
        `;
        
        const title = document.createElement('div');
        title.style.cssText = 'font-weight: 600; font-size: 14px; color: var(--text-primary); margin-bottom: 4px;';
        title.textContent = notif.title;
        
        const message = document.createElement('div');
        message.style.cssText = 'font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;';
        message.textContent = notif.message;
        
        const time = document.createElement('div');
        time.style.cssText = 'font-size: 11px; color: var(--text-muted);';
        time.textContent = notif.time;
        
        card.appendChild(title);
        card.appendChild(message);
        card.appendChild(time);
        contentDiv.appendChild(card);
      });
      
      topSheet.setContent(contentDiv);
    });
    
    container.appendChild(topBtn);

    // Demo 4: Bottom sheet
    const bottomBtn = createTriggerButton('Open from Bottom', 'bottom');
    const bottomSheet = window.createSheet({ side: 'bottom' });
    
    bottomBtn.addEventListener('click', () => {
      bottomSheet.open();
      bottomSheet.setHeader('Share Options', 'Choose how you want to share this content');
      
      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px; padding: 8px 0;';
      
      const shareOptions = [
        { icon: '📧', label: 'Email' },
        { icon: '💬', label: 'Message' },
        { icon: '🔗', label: 'Copy Link' },
        { icon: '📱', label: 'Social' },
        { icon: '📤', label: 'Export' },
        { icon: '🖨️', label: 'Print' }
      ];
      
      shareOptions.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        `;
        optionDiv.onmouseover = () => optionDiv.style.background = 'var(--bg-secondary)';
        optionDiv.onmouseout = () => optionDiv.style.background = 'transparent';
        optionDiv.onclick = () => bottomSheet.close();
        
        const icon = document.createElement('div');
        icon.style.cssText = 'font-size: 32px;';
        icon.textContent = option.icon;
        
        const label = document.createElement('div');
        label.style.cssText = 'font-size: 12px; color: var(--text-secondary); font-weight: 500;';
        label.textContent = option.label;
        
        optionDiv.appendChild(icon);
        optionDiv.appendChild(label);
        contentDiv.appendChild(optionDiv);
      });
      
      bottomSheet.setContent(contentDiv);
    });
    
    container.appendChild(bottomBtn);

    console.log('Sheet demos initialized successfully');
  }
})();

// ==================== Sidebar Component ====================
window.createSidebar = function(options = {}) {
  const {
    side = 'left',
    variant = 'sidebar',
    collapsible = 'offcanvas',
    defaultOpen = true,
    onOpenChange = null,
    keyboardShortcut = 'b'
  } = options;

  let isOpen = defaultOpen;
  let isMobileOpen = false;
  let isMobile = window.innerWidth < 768;
  let wrapper = null;
  let container = null;
  let mobileSheet = null;

  // Detect mobile viewport
  function updateIsMobile() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth < 768;
    
    if (wasMobile !== isMobile) {
      // Rebuild sidebar when switching between mobile/desktop
      if (wrapper && wrapper.isConnected) {
        const parent = wrapper.parentElement;
        const nextSibling = wrapper.nextSibling;
        wrapper.remove();
        const newSidebar = build();
        if (nextSibling) {
          parent.insertBefore(newSidebar, nextSibling);
        } else {
          parent.appendChild(newSidebar);
        }
      }
    }
  }

  window.addEventListener('resize', updateIsMobile);

  function createWrapper() {
    const div = document.createElement('div');
    div.className = 'sidebar-wrapper';
    div.setAttribute('data-variant', variant);
    div.setAttribute('data-state', isOpen ? 'expanded' : 'collapsed');
    div.style.cssText = `
      --sidebar-width: 16rem;
      --sidebar-width-icon: 3rem;
    `;
    return div;
  }

  function createMobileSidebar(content) {
    mobileSheet = window.createSheet({
      side: side,
      onClose: () => {
        isMobileOpen = false;
        if (onOpenChange) onOpenChange(false);
      }
    });

    const sheetContent = mobileSheet.getContent();
    sheetContent.style.cssText += `
      width: 18rem;
      background: var(--sidebar-background);
      color: var(--sidebar-foreground);
      padding: 0;
    `;
    sheetContent.setAttribute('data-sidebar', 'sidebar');
    sheetContent.setAttribute('data-mobile', 'true');

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'sidebar-inner';
    contentWrapper.style.cssText = 'display: flex; height: 100%; width: 100%; flex-direction: column;';
    
    if (typeof content === 'string') {
      contentWrapper.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      contentWrapper.appendChild(content.cloneNode(true));
    }

    mobileSheet.setContent(contentWrapper);

    return document.createElement('div'); // Empty placeholder
  }

  function createDesktopSidebar(content) {
    const container = document.createElement('div');
    container.className = 'sidebar-container';
    container.setAttribute('data-state', isOpen ? 'expanded' : 'collapsed');
    container.setAttribute('data-collapsible', isOpen ? '' : collapsible);
    container.setAttribute('data-variant', variant);
    container.setAttribute('data-side', side);

    // Gap element for layout
    const gap = document.createElement('div');
    gap.className = 'sidebar-gap';
    container.appendChild(gap);

    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'sidebar-content-wrapper';

    const inner = document.createElement('div');
    inner.className = 'sidebar-inner';
    inner.setAttribute('data-sidebar', 'sidebar');
    
    if (typeof content === 'string') {
      inner.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      inner.appendChild(content);
    }

    contentWrapper.appendChild(inner);
    container.appendChild(contentWrapper);

    // Add rail for hover toggle
    if (collapsible !== 'none') {
      const rail = document.createElement('button');
      rail.className = 'sidebar-rail';
      rail.setAttribute('data-sidebar', 'rail');
      rail.setAttribute('aria-label', 'Toggle Sidebar');
      rail.setAttribute('tabindex', '-1');
      rail.title = 'Toggle Sidebar';
      rail.onclick = () => toggle();
      contentWrapper.appendChild(rail);
    }

    return container;
  }

  function build() {
    wrapper = createWrapper();
    
    // Content is set later via setContent method
    container = document.createElement('div');
    wrapper.appendChild(container);

    return wrapper;
  }

  function toggle() {
    if (isMobile) {
      isMobileOpen = !isMobileOpen;
      if (mobileSheet) {
        if (isMobileOpen) {
          mobileSheet.open();
        } else {
          mobileSheet.close();
        }
      }
      if (onOpenChange) onOpenChange(isMobileOpen);
    } else {
      isOpen = !isOpen;
      if (wrapper) {
        wrapper.setAttribute('data-state', isOpen ? 'expanded' : 'collapsed');
      }
      if (container) {
        container.setAttribute('data-state', isOpen ? 'expanded' : 'collapsed');
        container.setAttribute('data-collapsible', isOpen ? '' : collapsible);
      }
      // Save to cookie
      document.cookie = `sidebar:state=${isOpen}; path=/; max-age=${60 * 60 * 24 * 7}`;
      if (onOpenChange) onOpenChange(isOpen);
    }
  }

  function setContent(content) {
    if (!wrapper || !container) return;
    
    container.innerHTML = '';
    
    if (isMobile) {
      container.appendChild(createMobileSidebar(content));
      if (isMobileOpen && mobileSheet) {
        mobileSheet.open();
      }
    } else {
      container.appendChild(createDesktopSidebar(content));
    }
  }

  // Keyboard shortcut
  function handleKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === keyboardShortcut) {
      e.preventDefault();
      toggle();
    }
  }

  window.addEventListener('keydown', handleKeydown);

  return {
    getElement: () => wrapper,
    toggle,
    setContent,
    open: () => {
      if (isMobile) {
        isMobileOpen = true;
        if (mobileSheet) mobileSheet.open();
      } else {
        isOpen = true;
        if (wrapper) wrapper.setAttribute('data-state', 'expanded');
        if (container) {
          container.setAttribute('data-state', 'expanded');
          container.setAttribute('data-collapsible', '');
        }
      }
      if (onOpenChange) onOpenChange(true);
    },
    close: () => {
      if (isMobile) {
        isMobileOpen = false;
        if (mobileSheet) mobileSheet.close();
      } else {
        isOpen = false;
        if (wrapper) wrapper.setAttribute('data-state', 'collapsed');
        if (container) {
          container.setAttribute('data-state', 'collapsed');
          container.setAttribute('data-collapsible', collapsible);
        }
      }
      if (onOpenChange) onOpenChange(false);
    },
    isOpen: () => isMobile ? isMobileOpen : isOpen,
    getState: () => isOpen ? 'expanded' : 'collapsed',
    isMobile: () => isMobile,
    destroy: () => {
      window.removeEventListener('resize', updateIsMobile);
      window.removeEventListener('keydown', handleKeydown);
      if (mobileSheet) {
        mobileSheet.close();
      }
      if (wrapper && wrapper.isConnected) {
        wrapper.remove();
      }
    }
  };
};

// Helper to create sidebar trigger button
window.createSidebarTrigger = function(sidebar) {
  const button = document.createElement('button');
  button.className = 'sidebar-trigger';
  button.setAttribute('data-sidebar', 'trigger');
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <path d="M9 3v18"/>
    </svg>
    <span class="sr-only">Toggle Sidebar</span>
  `;
  button.onclick = () => sidebar.toggle();
  return button;
};

// Helper to create sidebar header
window.createSidebarHeader = function(content) {
  const header = document.createElement('div');
  header.className = 'sidebar-header';
  header.setAttribute('data-sidebar', 'header');
  if (typeof content === 'string') {
    header.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    header.appendChild(content);
  }
  return header;
};

// Helper to create sidebar footer
window.createSidebarFooter = function(content) {
  const footer = document.createElement('div');
  footer.className = 'sidebar-footer';
  footer.setAttribute('data-sidebar', 'footer');
  if (typeof content === 'string') {
    footer.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    footer.appendChild(content);
  }
  return footer;
};

// Helper to create sidebar content
window.createSidebarContent = function(content) {
  const contentDiv = document.createElement('div');
  contentDiv.className = 'sidebar-content';
  contentDiv.setAttribute('data-sidebar', 'content');
  if (typeof content === 'string') {
    contentDiv.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    contentDiv.appendChild(content);
  }
  return contentDiv;
};

// Helper to create sidebar menu
window.createSidebarMenu = function(items = []) {
  const menu = document.createElement('ul');
  menu.className = 'sidebar-menu';
  menu.setAttribute('data-sidebar', 'menu');

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'sidebar-menu-item';
    li.setAttribute('data-sidebar', 'menu-item');

    const button = document.createElement('button');
    button.className = 'sidebar-menu-button';
    button.setAttribute('data-sidebar', 'menu-button');
    button.setAttribute('data-size', item.size || 'default');
    if (item.active) button.setAttribute('data-active', 'true');
    if (item.variant) button.setAttribute('data-variant', item.variant);

    if (item.icon) {
      const icon = document.createElement('span');
      icon.innerHTML = item.icon;
      button.appendChild(icon);
    }

    const label = document.createElement('span');
    label.textContent = item.label;
    button.appendChild(label);

    if (item.onClick) button.onclick = item.onClick;

    li.appendChild(button);

    // Add badge if provided
    if (item.badge) {
      const badge = document.createElement('div');
      badge.className = 'sidebar-menu-badge';
      badge.setAttribute('data-sidebar', 'menu-badge');
      badge.textContent = item.badge;
      li.appendChild(badge);
    }

    // Add submenu if provided
    if (item.submenu && item.submenu.length > 0) {
      const submenu = document.createElement('ul');
      submenu.className = 'sidebar-menu-sub';
      submenu.setAttribute('data-sidebar', 'menu-sub');

      item.submenu.forEach(subitem => {
        const subli = document.createElement('li');
        const subbutton = document.createElement('button');
        subbutton.className = 'sidebar-menu-sub-button';
        subbutton.setAttribute('data-sidebar', 'menu-sub-button');
        subbutton.setAttribute('data-size', subitem.size || 'md');
        if (subitem.active) subbutton.setAttribute('data-active', 'true');
        subbutton.textContent = subitem.label;
        if (subitem.onClick) subbutton.onclick = subitem.onClick;
        subli.appendChild(subbutton);
        submenu.appendChild(subli);
      });

      li.appendChild(submenu);
    }

    menu.appendChild(li);
  });

  return menu;
};

// Helper to create sidebar group
window.createSidebarGroup = function(options = {}) {
  const group = document.createElement('div');
  group.className = 'sidebar-group';
  group.setAttribute('data-sidebar', 'group');

  if (options.label) {
    const label = document.createElement('div');
    label.className = 'sidebar-group-label';
    label.setAttribute('data-sidebar', 'group-label');
    label.textContent = options.label;
    group.appendChild(label);
  }

  if (options.content) {
    const content = document.createElement('div');
    content.className = 'sidebar-group-content';
    content.setAttribute('data-sidebar', 'group-content');
    if (typeof options.content === 'string') {
      content.innerHTML = options.content;
    } else if (options.content instanceof HTMLElement) {
      content.appendChild(options.content);
    }
    group.appendChild(content);
  }

  return group;
};

// Helper to create sidebar inset (main content area)
window.createSidebarInset = function(content) {
  const inset = document.createElement('main');
  inset.className = 'sidebar-inset';
  if (typeof content === 'string') {
    inset.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    inset.appendChild(content);
  }
  return inset;
};

console.log('Sidebar utilities loaded successfully');

// ===== Initialize Sidebar Demo =====
(function initSidebarDemo() {
  const container = document.getElementById('sidebarDemoContainer');
  if (!container) return;

  // Demo 1: Collapsible Sidebar (Offcanvas)
  const demo1 = document.createElement('div');
  demo1.style.cssText = 'margin-bottom: 48px;';
  
  const demo1Title = document.createElement('h3');
  demo1Title.textContent = 'Collapsible Sidebar (Offcanvas)';
  demo1Title.style.cssText = 'margin-bottom: 16px; font-size: 16px; font-weight: 600;';
  demo1.appendChild(demo1Title);

  const demo1Wrapper = document.createElement('div');
  demo1Wrapper.style.cssText = `
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    height: 500px;
    position: relative;
  `;

  const sidebar1 = window.createSidebar({
    side: 'left',
    variant: 'sidebar',
    collapsible: 'offcanvas',
    defaultOpen: true
  });

  // Build sidebar content
  const header1 = window.createSidebarHeader(`
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px;">
      <span style="font-size: 20px;">🏢</span>
      <span style="font-weight: 600;">Enterprise App</span>
    </div>
  `);

  const content1 = window.createSidebarContent('');
  
  const group1 = window.createSidebarGroup({
    label: 'Main Menu',
    content: window.createSidebarMenu([
      { icon: '🏠', label: 'Dashboard', active: true },
      { icon: '📊', label: 'Analytics', badge: '3' },
      { icon: '📁', label: 'Projects', submenu: [
        { label: 'Active Projects', active: false },
        { label: 'Archived', active: false }
      ]},
      { icon: '👥', label: 'Team' },
      { icon: '⚙️', label: 'Settings' }
    ])
  });
  content1.appendChild(group1);

  const group2 = window.createSidebarGroup({
    label: 'Resources',
    content: window.createSidebarMenu([
      { icon: '📚', label: 'Documentation' },
      { icon: '💬', label: 'Support' },
      { icon: 'ℹ️', label: 'About' }
    ])
  });
  content1.appendChild(group2);

  const footer1 = window.createSidebarFooter(`
    <div style="padding: 8px; display: flex; align-items: center; gap: 8px; border-radius: 6px; background: var(--bg-secondary);">
      <span style="font-size: 24px;">👤</span>
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">John Doe</div>
        <div style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">john@example.com</div>
      </div>
    </div>
  `);

  const fullContent1 = document.createElement('div');
  fullContent1.appendChild(header1);
  fullContent1.appendChild(content1);
  fullContent1.appendChild(footer1);

  sidebar1.setContent(fullContent1);

  // Main content area
  const inset1 = window.createSidebarInset(`
    <div style="padding: 24px;">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
        <div id="trigger1Container"></div>
        <h1 style="font-size: 24px; font-weight: 600; margin: 0;">Dashboard</h1>
      </div>
      <p>Click the toggle button to show/hide the sidebar. On desktop, it slides offcanvas. On mobile (< 768px), it opens as a sheet overlay.</p>
      <p style="margin-top: 16px; padding: 16px; background: var(--bg-secondary); border-radius: 8px;">
        <strong>Try it:</strong> Press <kbd style="padding: 2px 6px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace;">Ctrl+B</kbd> (or <kbd style="padding: 2px 6px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace;">Cmd+B</kbd> on Mac) to toggle the sidebar with keyboard shortcut.
      </p>
      <div style="margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
        <div style="padding: 20px; background: var(--bg-secondary); border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 700; color: var(--color-blue);">2,543</div>
          <div style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">Total Users</div>
        </div>
        <div style="padding: 20px; background: var(--bg-secondary); border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 700; color: var(--color-green);">87%</div>
          <div style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">Satisfaction</div>
        </div>
        <div style="padding: 20px; background: var(--bg-secondary); border-radius: 8px;">
          <div style="font-size: 32px; font-weight: 700; color: var(--color-orange);">45</div>
          <div style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">Active Projects</div>
        </div>
      </div>
    </div>
  `);

  const sidebarWrapper1 = sidebar1.getElement();
  sidebarWrapper1.appendChild(inset1);
  demo1Wrapper.appendChild(sidebarWrapper1);

  // Add trigger to inset
  const trigger1 = window.createSidebarTrigger(sidebar1);
  demo1Wrapper.querySelector('#trigger1Container').appendChild(trigger1);

  demo1.appendChild(demo1Wrapper);
  container.appendChild(demo1);

  // Demo 2: Icon Collapsible Sidebar
  const demo2 = document.createElement('div');
  demo2.style.cssText = 'margin-bottom: 48px;';
  
  const demo2Title = document.createElement('h3');
  demo2Title.textContent = 'Icon Collapsible Sidebar';
  demo2Title.style.cssText = 'margin-bottom: 16px; font-size: 16px; font-weight: 600;';
  demo2.appendChild(demo2Title);

  const demo2Wrapper = document.createElement('div');
  demo2Wrapper.style.cssText = `
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    height: 500px;
    position: relative;
  `;

  const sidebar2 = window.createSidebar({
    side: 'left',
    variant: 'sidebar',
    collapsible: 'icon',
    defaultOpen: true
  });

  const header2 = window.createSidebarHeader(`
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px;">
      <span style="font-size: 20px;">📱</span>
      <span style="font-weight: 600;">App Name</span>
    </div>
  `);

  const content2 = window.createSidebarContent('');
  
  const menuGroup2 = window.createSidebarGroup({
    label: 'Navigation',
    content: window.createSidebarMenu([
      { icon: '🏠', label: 'Home', active: true },
      { icon: '🔍', label: 'Search' },
      { icon: '💼', label: 'Work', badge: '12' },
      { icon: '📧', label: 'Messages', badge: '5' },
      { icon: '🔔', label: 'Notifications', badge: '3' },
      { icon: '⭐', label: 'Favorites' }
    ])
  });
  content2.appendChild(menuGroup2);

  const footer2 = window.createSidebarFooter(`
    <div style="padding: 8px; display: flex; align-items: center; gap: 8px; border-radius: 6px; background: var(--bg-secondary);">
      <span style="font-size: 24px;">👨‍💼</span>
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 14px; font-weight: 500;">Admin User</div>
      </div>
    </div>
  `);

  const fullContent2 = document.createElement('div');
  fullContent2.appendChild(header2);
  fullContent2.appendChild(content2);
  fullContent2.appendChild(footer2);

  sidebar2.setContent(fullContent2);

  const inset2 = window.createSidebarInset(`
    <div style="padding: 24px;">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
        <div id="trigger2Container"></div>
        <h1 style="font-size: 24px; font-weight: 600; margin: 0;">Icon Mode</h1>
      </div>
      <p>When collapsed, this sidebar shrinks to icon-only mode instead of sliding offcanvas. Text labels and badges are hidden.</p>
      <p style="margin-top: 16px; padding: 16px; background: var(--bg-secondary); border-radius: 8px;">
        Hover over the sidebar edge to see the rail that allows you to toggle the sidebar.
      </p>
    </div>
  `);

  const sidebarWrapper2 = sidebar2.getElement();
  sidebarWrapper2.appendChild(inset2);
  demo2Wrapper.appendChild(sidebarWrapper2);

  const trigger2 = window.createSidebarTrigger(sidebar2);
  demo2Wrapper.querySelector('#trigger2Container').appendChild(trigger2);

  demo2.appendChild(demo2Wrapper);
  container.appendChild(demo2);

  // Demo 3: Floating Variant
  const demo3 = document.createElement('div');
  demo3.style.cssText = 'margin-bottom: 48px;';
  
  const demo3Title = document.createElement('h3');
  demo3Title.textContent = 'Floating Variant';
  demo3Title.style.cssText = 'margin-bottom: 16px; font-size: 16px; font-weight: 600;';
  demo3.appendChild(demo3Title);

  const demo3Wrapper = document.createElement('div');
  demo3Wrapper.style.cssText = `
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    height: 500px;
    position: relative;
    background: var(--sidebar-background);
  `;

  const sidebar3 = window.createSidebar({
    side: 'left',
    variant: 'floating',
    collapsible: 'icon',
    defaultOpen: true
  });

  const header3 = window.createSidebarHeader(`
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px;">
      <span style="font-size: 20px;">🎨</span>
      <span style="font-weight: 600;">Design Tools</span>
    </div>
  `);

  const content3 = window.createSidebarContent('');
  
  const menuGroup3 = window.createSidebarGroup({
    label: 'Tools',
    content: window.createSidebarMenu([
      { icon: '✏️', label: 'Edit', active: true },
      { icon: '🖼️', label: 'Images' },
      { icon: '🎨', label: 'Colors' },
      { icon: '📐', label: 'Layout' },
      { icon: '📝', label: 'Typography' }
    ])
  });
  content3.appendChild(menuGroup3);

  const fullContent3 = document.createElement('div');
  fullContent3.appendChild(header3);
  fullContent3.appendChild(content3);

  sidebar3.setContent(fullContent3);

  const inset3 = window.createSidebarInset(`
    <div style="padding: 24px;">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
        <div id="trigger3Container"></div>
        <h1 style="font-size: 24px; font-weight: 600; margin: 0;">Floating Sidebar</h1>
      </div>
      <p>The floating variant adds rounded corners, shadow, and padding around the sidebar for a card-like appearance.</p>
    </div>
  `);

  const sidebarWrapper3 = sidebar3.getElement();
  sidebarWrapper3.appendChild(inset3);
  demo3Wrapper.appendChild(sidebarWrapper3);

  const trigger3 = window.createSidebarTrigger(sidebar3);
  demo3Wrapper.querySelector('#trigger3Container').appendChild(trigger3);

  demo3.appendChild(demo3Wrapper);
  container.appendChild(demo3);

  // Demo 4: Right Side
  const demo4 = document.createElement('div');
  
  const demo4Title = document.createElement('h3');
  demo4Title.textContent = 'Right Side Sidebar';
  demo4Title.style.cssText = 'margin-bottom: 16px; font-size: 16px; font-weight: 600;';
  demo4.appendChild(demo4Title);

  const demo4Wrapper = document.createElement('div');
  demo4Wrapper.style.cssText = `
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    height: 500px;
    position: relative;
  `;

  const sidebar4 = window.createSidebar({
    side: 'right',
    variant: 'sidebar',
    collapsible: 'offcanvas',
    defaultOpen: false
  });

  const header4 = window.createSidebarHeader(`
    <div style="display: flex; align-items: center; gap: 8px; padding: 8px;">
      <span style="font-size: 20px;">ℹ️</span>
      <span style="font-weight: 600;">Info Panel</span>
    </div>
  `);

  const content4 = window.createSidebarContent(`
    <div style="padding: 16px;">
      <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Properties</h4>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Width</div>
          <div style="font-size: 14px; font-weight: 500;">320px</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Height</div>
          <div style="font-size: 14px; font-weight: 500;">240px</div>
        </div>
        <div>
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Position</div>
          <div style="font-size: 14px; font-weight: 500;">Absolute</div>
        </div>
      </div>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-color);" />
      <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Layers</h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="padding: 8px; background: var(--bg-secondary); border-radius: 6px; cursor: pointer;">
          <div style="font-size: 13px;">🖼️ Background</div>
        </div>
        <div style="padding: 8px; background: var(--sidebar-accent); border-radius: 6px; cursor: pointer;">
          <div style="font-size: 13px;">📝 Content</div>
        </div>
        <div style="padding: 8px; background: var(--bg-secondary); border-radius: 6px; cursor: pointer;">
          <div style="font-size: 13px;">✨ Effects</div>
        </div>
      </div>
    </div>
  `);

  const fullContent4 = document.createElement('div');
  fullContent4.appendChild(header4);
  fullContent4.appendChild(content4);

  sidebar4.setContent(fullContent4);

  const inset4 = window.createSidebarInset(`
    <div style="padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
        <h1 style="font-size: 24px; font-weight: 600; margin: 0;">Right Sidebar</h1>
        <div id="trigger4Container"></div>
      </div>
      <p>Sidebars can be positioned on either side. This one is on the right and starts collapsed.</p>
      <p style="margin-top: 16px;">Right sidebars are commonly used for properties panels, info panels, or contextual help.</p>
    </div>
  `);

  const sidebarWrapper4 = sidebar4.getElement();
  sidebarWrapper4.appendChild(inset4);
  demo4Wrapper.appendChild(sidebarWrapper4);

  const trigger4 = window.createSidebarTrigger(sidebar4);
  demo4Wrapper.querySelector('#trigger4Container').appendChild(trigger4);

  demo4.appendChild(demo4Wrapper);
  container.appendChild(demo4);

  console.log('Sidebar demos initialized successfully');
})();

// ==================== Skeleton Component ====================
window.createSkeleton = function(options = {}) {
  const {
    width = '100%',
    height = '16px',
    variant = 'text', // 'text', 'title', 'avatar', 'button', 'image', 'custom'
    shimmer = true,
    className = ''
  } = options;

  const skeleton = document.createElement('div');
  skeleton.className = `skeleton ${shimmer ? 'skeleton-shimmer' : ''} ${className}`;
  skeleton.setAttribute('role', 'status');
  skeleton.setAttribute('aria-label', 'Loading...');
  skeleton.setAttribute('aria-busy', 'true');

  // Apply variant-specific classes
  switch (variant) {
    case 'title':
      skeleton.classList.add('skeleton-title');
      break;
    case 'text':
      skeleton.classList.add('skeleton-text');
      break;
    case 'avatar':
      skeleton.classList.add('skeleton-avatar');
      break;
    case 'button':
      skeleton.classList.add('skeleton-button');
      break;
    case 'image':
      skeleton.classList.add('skeleton-image');
      break;
  }

  // Apply custom dimensions
  if (width) skeleton.style.width = typeof width === 'number' ? `${width}px` : width;
  if (height && variant !== 'image') {
    skeleton.style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return skeleton;
};

// Helper to create a skeleton card
window.createSkeletonCard = function(options = {}) {
  const {
    lines = 3,
    lineWidths = ['75%', '50%', '66%'],
    showTitle = true,
    showAvatar = false,
    showImage = false,
    showButton = false,
    glassEffect = false,
    className = ''
  } = options;

  const card = document.createElement('div');
  card.className = `skeleton-card ${glassEffect ? 'glass-effect' : ''} ${className}`;
  card.style.cssText = 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;';

  const content = document.createElement('div');
  content.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

  // Add header with avatar if requested
  if (showAvatar) {
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; gap: 12px;';

    const avatar = window.createSkeleton({
      variant: 'avatar',
      width: '48px',
      height: '48px',
      shimmer: true
    });

    const headerText = document.createElement('div');
    headerText.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 8px;';
    headerText.appendChild(window.createSkeleton({ width: '120px', height: '16px', shimmer: true }));
    headerText.appendChild(window.createSkeleton({ width: '80px', height: '12px', shimmer: true }));

    header.appendChild(avatar);
    header.appendChild(headerText);
    content.appendChild(header);
  }

  // Add image if requested
  if (showImage) {
    const image = window.createSkeleton({
      variant: 'image',
      shimmer: true
    });
    content.appendChild(image);
  }

  // Add text section
  const textSection = document.createElement('div');
  textSection.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

  if (showTitle) {
    const title = window.createSkeleton({
      variant: 'title',
      width: lineWidths[0] || '75%',
      shimmer: true
    });
    textSection.appendChild(title);
  }

  // Add text lines
  const numLines = showTitle ? lines - 1 : lines;
  for (let i = 0; i < numLines; i++) {
    const line = window.createSkeleton({
      variant: 'text',
      width: lineWidths[i + (showTitle ? 1 : 0)] || '100%',
      shimmer: true
    });
    textSection.appendChild(line);
  }

  content.appendChild(textSection);

  // Add button if requested
  if (showButton) {
    const button = window.createSkeleton({
      variant: 'button',
      width: '120px',
      shimmer: true
    });
    button.style.marginTop = '8px';
    content.appendChild(button);
  }

  card.appendChild(content);

  return card;
};

// Helper to create list of skeleton items
window.createSkeletonList = function(options = {}) {
  const {
    count = 5,
    itemHeight = '60px',
    showAvatar = true,
    gap = '12px'
  } = options;

  const list = document.createElement('div');
  list.style.cssText = `display: flex; flex-direction: column; gap: ${gap};`;

  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      height: ${itemHeight};
    `;

    if (showAvatar) {
      const avatar = window.createSkeleton({
        variant: 'avatar',
        width: '40px',
        height: '40px',
        shimmer: true
      });
      item.appendChild(avatar);
    }

    const textContent = document.createElement('div');
    textContent.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 8px;';
    textContent.appendChild(window.createSkeleton({ width: '60%', height: '14px', shimmer: true }));
    textContent.appendChild(window.createSkeleton({ width: '40%', height: '12px', shimmer: true }));

    item.appendChild(textContent);
    list.appendChild(item);
  }

  return list;
};

// Helper to create table skeleton
window.createSkeletonTable = function(options = {}) {
  const {
    rows = 5,
    columns = 4,
    showHeader = true
  } = options;

  const table = document.createElement('div');
  table.style.cssText = 'width: 100%; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;';

  // Header
  if (showHeader) {
    const header = document.createElement('div');
    header.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: 16px;
      padding: 16px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    `;

    for (let i = 0; i < columns; i++) {
      header.appendChild(window.createSkeleton({ width: '80%', height: '14px', shimmer: true }));
    }

    table.appendChild(header);
  }

  // Rows
  for (let i = 0; i < rows; i++) {
    const row = document.createElement('div');
    row.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: 16px;
      padding: 16px;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
    `;

    for (let j = 0; j < columns; j++) {
      const width = j === 0 ? '90%' : Math.random() > 0.5 ? '70%' : '60%';
      row.appendChild(window.createSkeleton({ width, height: '14px', shimmer: true }));
    }

    table.appendChild(row);
  }

  return table;
};

console.log('Skeleton utilities loaded successfully');

// ===== Initialize Skeleton Demo =====
(function initSkeletonDemo() {
  const container = document.getElementById('skeletonDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: flex; flex-direction: column; gap: 48px;';

  // Demo 1: Basic Skeleton Card
  const demo1 = document.createElement('div');
  
  const demo1Title = document.createElement('h3');
  demo1Title.textContent = 'Basic Skeleton Card';
  demo1Title.style.cssText = 'margin-bottom: 16px; font-size: 16px; font-weight: 600;';
  demo1.appendChild(demo1Title);

  const demo1Grid = document.createElement('div');
  demo1Grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;';

  // Simple card
  const simpleCard = window.createSkeletonCard({
    lines: 3,
    lineWidths: ['75%', '50%', '66%'],
    showTitle: true
  });
  demo1Grid.appendChild(simpleCard);

  // Card with avatar
  const avatarCard = window.createSkeletonCard({
    lines: 3,
    lineWidths: ['80%', '60%', '70%'],
    showTitle: true,
    showAvatar: true
  });
  demo1Grid.appendChild(avatarCard);

  // Card with image
  const imageCard = window.createSkeletonCard({
    lines: 2,
    lineWidths: ['70%', '50%'],
    showTitle: true,
    showImage: true
  });
  demo1Grid.appendChild(imageCard);

  demo1.appendChild(demo1Grid);
  container.appendChild(demo1);

  // Demo 2: Glass Effect Card
  const demo2 = document.createElement('div');
  
  const demo2Title = document.createElement('h3');
  demo2Title.textContent = 'Glass Effect Card';
  demo2Title.style.cssText = 'margin-bottom: 16px; font-size: 16px; font-weight: 600;';
  demo2.appendChild(demo2Title);

  const demo2Grid = document.createElement('div');
  demo2Grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;';

  const glassCard1 = window.createSkeletonCard({
    lines: 4,
    lineWidths: ['75%', '60%', '80%', '50%'],
    showTitle: true,
    showAvatar: true,
    glassEffect: true
  });
  demo2Grid.appendChild(glassCard1);

  const glassCard2 = window.createSkeletonCard({
    lines: 3,
    lineWidths: ['70%', '55%', '65%'],
    showTitle: true,
    showImage: true,
    showButton: true,
    glassEffect: true
  });
  demo2Grid.appendChild(glassCard2);

  demo2.appendChild(demo2Grid);
  container.appendChild(demo2);

  // Demo 3: List Skeletons
  const demo3 = document.createElement('div');
  
  const demo3Title = document.createElement('h3');
  demo3Title.textContent = 'List Skeleton';
  demo3Title.style.cssText = 'margin-bottom: 16px; font-size: 16px; font-weight: 600;';
  demo3.appendChild(demo3Title);

  const demo3Grid = document.createElement('div');
  demo3Grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px;';

  const list1 = window.createSkeletonList({
    count: 5,
    itemHeight: '72px',
    showAvatar: true
  });
  demo3Grid.appendChild(list1);

  const list2 = window.createSkeletonList({
    count: 4,
    itemHeight: '60px',
    showAvatar: false,
    gap: '8px'
  });
  demo3Grid.appendChild(list2);

  demo3.appendChild(demo3Grid);
  container.appendChild(demo3);

  // Demo 4: Table Skeleton
  const demo4 = document.createElement('div');
  
  const demo4Title = document.createElement('h3');
  demo4Title.textContent = 'Table Skeleton';
  demo4Title.style.cssText = 'margin-bottom: 16px; font-size: 16px; font-weight: 600;';
  demo4.appendChild(demo4Title);

  const table = window.createSkeletonTable({
    rows: 6,
    columns: 4,
    showHeader: true
  });
  demo4.appendChild(table);
  container.appendChild(demo4);

  // Demo 5: Custom Skeletons
  const demo5 = document.createElement('div');
  
  const demo5Title = document.createElement('h3');
  demo5Title.textContent = 'Custom Skeleton Elements';
  demo5Title.style.cssText = 'margin-bottom: 16px; font-size: 16px; font-weight: 600;';
  demo5.appendChild(demo5Title);

  const demo5Grid = document.createElement('div');
  demo5Grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;';

  // Avatar group
  const avatarGroup = document.createElement('div');
  avatarGroup.style.cssText = `
    padding: 24px;
    border-radius: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
  `;
  const avatarGroupTitle = document.createElement('div');
  avatarGroupTitle.textContent = 'Avatars';
  avatarGroupTitle.style.cssText = 'margin-bottom: 16px; font-size: 14px; font-weight: 600;';
  avatarGroup.appendChild(avatarGroupTitle);
  
  const avatars = document.createElement('div');
  avatars.style.cssText = 'display: flex; gap: 12px; align-items: center;';
  [64, 48, 40, 32].forEach(size => {
    const avatar = window.createSkeleton({
      variant: 'avatar',
      width: `${size}px`,
      height: `${size}px`,
      shimmer: true
    });
    avatars.appendChild(avatar);
  });
  avatarGroup.appendChild(avatars);
  demo5Grid.appendChild(avatarGroup);

  // Buttons group
  const buttonGroup = document.createElement('div');
  buttonGroup.style.cssText = `
    padding: 24px;
    border-radius: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
  `;
  const buttonGroupTitle = document.createElement('div');
  buttonGroupTitle.textContent = 'Buttons';
  buttonGroupTitle.style.cssText = 'margin-bottom: 16px; font-size: 14px; font-weight: 600;';
  buttonGroup.appendChild(buttonGroupTitle);
  
  const buttons = document.createElement('div');
  buttons.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
  ['120px', '160px', '100px'].forEach(width => {
    const button = window.createSkeleton({
      variant: 'button',
      width: width,
      shimmer: true
    });
    buttons.appendChild(button);
  });
  buttonGroup.appendChild(buttons);
  demo5Grid.appendChild(buttonGroup);

  // Text lines group
  const textGroup = document.createElement('div');
  textGroup.style.cssText = `
    padding: 24px;
    border-radius: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
  `;
  const textGroupTitle = document.createElement('div');
  textGroupTitle.textContent = 'Text Lines';
  textGroupTitle.style.cssText = 'margin-bottom: 16px; font-size: 14px; font-weight: 600;';
  textGroup.appendChild(textGroupTitle);
  
  const textLines = document.createElement('div');
  textLines.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
  ['100%', '90%', '80%', '70%'].forEach(width => {
    const line = window.createSkeleton({
      variant: 'text',
      width: width,
      shimmer: true
    });
    textLines.appendChild(line);
  });
  textGroup.appendChild(textLines);
  demo5Grid.appendChild(textGroup);

  // Images group
  const imageGroup = document.createElement('div');
  imageGroup.style.cssText = `
    padding: 24px;
    border-radius: 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
  `;
  const imageGroupTitle = document.createElement('div');
  imageGroupTitle.textContent = 'Image';
  imageGroupTitle.style.cssText = 'margin-bottom: 16px; font-size: 14px; font-weight: 600;';
  imageGroup.appendChild(imageGroupTitle);
  
  const image = window.createSkeleton({
    variant: 'image',
    shimmer: true
  });
  imageGroup.appendChild(image);
  demo5Grid.appendChild(imageGroup);

  demo5.appendChild(demo5Grid);
  container.appendChild(demo5);

  console.log('Skeleton demos initialized successfully');
})();

// ==================== Slider Component ====================
window.createSlider = function(options = {}) {
  const {
    min = 0,
    max = 100,
    step = 1,
    values = 50,
    disabled = false,
    onChange = null
  } = options;

  let currentValues = Array.isArray(values) ? [...values] : [values];
  let isDisabled = disabled;
  let changeHandler = onChange;

  const clampAndSnap = (val) => {
    const snapped = Math.round((val - min) / step) * step + min;
    return Math.min(max, Math.max(min, snapped));
  };

  // Normalize values and ensure sorted order for ranges
  currentValues = currentValues
    .map((v) => clampAndSnap(v))
    .sort((a, b) => a - b);

  const root = document.createElement('div');
  root.className = 'slider';
  if (isDisabled) root.setAttribute('data-disabled', 'true');

  const track = document.createElement('div');
  track.className = 'slider-track';

  const range = document.createElement('div');
  range.className = 'slider-range';
  track.appendChild(range);

  const thumbs = [];

  function valueToPercent(val) {
    return ((val - min) / (max - min)) * 100;
  }

  function updateRangeAndThumbs() {
    const percents = currentValues.map(valueToPercent);

    if (currentValues.length === 1) {
      range.style.left = '0%';
      range.style.width = `${percents[0]}%`;
    } else {
      const start = percents[0];
      const end = percents[percents.length - 1];
      range.style.left = `${start}%`;
      range.style.width = `${end - start}%`;
    }

    thumbs.forEach((thumb, idx) => {
      const percent = percents[idx];
      thumb.style.left = `${percent}%`;
      thumb.setAttribute('aria-valuemin', String(min));
      thumb.setAttribute('aria-valuemax', String(max));
      thumb.setAttribute('aria-valuenow', String(currentValues[idx]));
      thumb.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
    });
  }

  function emitChange() {
    if (typeof changeHandler === 'function') {
      const payload = currentValues.length === 1 ? currentValues[0] : [...currentValues];
      changeHandler(payload);
    }
  }

  function setValues(newValues) {
    const normalized = (Array.isArray(newValues) ? [...newValues] : [newValues])
      .map((v) => clampAndSnap(v))
      .sort((a, b) => a - b);
    currentValues = normalized;
    updateRangeAndThumbs();
    emitChange();
  }

  function updateValueAtIndex(idx, val) {
    const snapped = clampAndSnap(val);
    if (idx > 0) {
      currentValues[idx] = Math.max(snapped, currentValues[idx - 1]);
    } else {
      currentValues[idx] = snapped;
    }
    if (idx < currentValues.length - 1) {
      currentValues[idx] = Math.min(currentValues[idx], currentValues[idx + 1]);
    }
    updateRangeAndThumbs();
    emitChange();
  }

  function handlePointerMove(idx, event) {
    const rect = track.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const nextVal = clampAndSnap(min + ratio * (max - min));
    updateValueAtIndex(idx, nextVal);
  }

  function setupThumb(thumb, idx) {
    thumb.addEventListener('pointerdown', (event) => {
      if (isDisabled) return;
      event.preventDefault();
      thumb.setPointerCapture(event.pointerId);
      const moveHandler = (e) => handlePointerMove(idx, e);
      const upHandler = () => {
        thumb.releasePointerCapture(event.pointerId);
        thumb.removeEventListener('pointermove', moveHandler);
        thumb.removeEventListener('pointerup', upHandler);
        thumb.removeEventListener('pointercancel', upHandler);
      };
      thumb.addEventListener('pointermove', moveHandler);
      thumb.addEventListener('pointerup', upHandler);
      thumb.addEventListener('pointercancel', upHandler);
    });

    thumb.addEventListener('keydown', (event) => {
      if (isDisabled) return;
      let delta = 0;
      const pageStep = step * 10;
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          delta = -step;
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          delta = step;
          break;
        case 'PageDown':
          delta = -pageStep;
          break;
        case 'PageUp':
          delta = pageStep;
          break;
        case 'Home':
          updateValueAtIndex(idx, min);
          event.preventDefault();
          return;
        case 'End':
          updateValueAtIndex(idx, max);
          event.preventDefault();
          return;
        default:
          return;
      }
      event.preventDefault();
      updateValueAtIndex(idx, currentValues[idx] + delta);
    });
  }

  // Create thumbs
  currentValues.forEach((value, idx) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'slider-thumb';
    thumb.setAttribute('role', 'slider');
    thumb.setAttribute('aria-label', 'Slider thumb');
    setupThumb(thumb, idx);
    thumbs.push(thumb);
    track.appendChild(thumb);
  });

  // Track click to move nearest thumb
  track.addEventListener('pointerdown', (event) => {
    if (isDisabled) return;
    const rect = track.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const proposed = clampAndSnap(min + ratio * (max - min));

    // Find nearest thumb
    let nearestIdx = 0;
    let smallestDiff = Math.abs(currentValues[0] - proposed);
    for (let i = 1; i < currentValues.length; i++) {
      const diff = Math.abs(currentValues[i] - proposed);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        nearestIdx = i;
      }
    }

    updateValueAtIndex(nearestIdx, proposed);
  });

  root.appendChild(track);
  updateRangeAndThumbs();

  return {
    getElement: () => root,
    getValue: () => (currentValues.length === 1 ? currentValues[0] : [...currentValues]),
    setValue: (val) => setValues(val),
    disable: () => {
      isDisabled = true;
      root.setAttribute('data-disabled', 'true');
    },
    enable: () => {
      isDisabled = false;
      root.removeAttribute('data-disabled');
    },
    setOnChange: (handler) => {
      if (typeof handler === 'function') changeHandler = handler;
    },
  };
};

console.log('Slider utilities loaded successfully');

// ===== Initialize Slider Demo =====
(function initSliderDemo() {
  const container = document.getElementById('sliderDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: flex; flex-direction: column; gap: 32px;';

  // Demo 1: Basic slider
  const demo1 = document.createElement('div');
  const demo1Title = document.createElement('h3');
  demo1Title.textContent = 'Basic Slider';
  demo1Title.style.cssText = 'margin-bottom: 12px; font-size: 16px; font-weight: 600;';
  demo1.appendChild(demo1Title);

  const valueLabel1 = document.createElement('div');
  valueLabel1.textContent = 'Value: 40';
  valueLabel1.style.cssText = 'margin-bottom: 8px; color: var(--text-muted); font-size: 14px;';
  demo1.appendChild(valueLabel1);

  const slider1 = window.createSlider({
    min: 0,
    max: 100,
    step: 1,
    values: 40,
    onChange: (val) => {
      valueLabel1.textContent = `Value: ${Array.isArray(val) ? val.join(' – ') : val}`;
    },
  });

  demo1.appendChild(slider1.getElement());
  container.appendChild(demo1);

  // Demo 2: Range slider
  const demo2 = document.createElement('div');
  const demo2Title = document.createElement('h3');
  demo2Title.textContent = 'Range Slider';
  demo2Title.style.cssText = 'margin-bottom: 12px; font-size: 16px; font-weight: 600;';
  demo2.appendChild(demo2Title);

  const valueLabel2 = document.createElement('div');
  valueLabel2.textContent = 'Range: 20 – 80';
  valueLabel2.style.cssText = 'margin-bottom: 8px; color: var(--text-muted); font-size: 14px;';
  demo2.appendChild(valueLabel2);

  const slider2 = window.createSlider({
    min: 0,
    max: 100,
    step: 1,
    values: [20, 80],
    onChange: (val) => {
      const [a, b] = Array.isArray(val) ? val : [val, val];
      valueLabel2.textContent = `Range: ${a} – ${b}`;
    },
  });

  demo2.appendChild(slider2.getElement());
  container.appendChild(demo2);

  // Demo 3: Stepped slider
  const demo3 = document.createElement('div');
  const demo3Title = document.createElement('h3');
  demo3Title.textContent = 'Stepped Slider (Step = 10)';
  demo3Title.style.cssText = 'margin-bottom: 12px; font-size: 16px; font-weight: 600;';
  demo3.appendChild(demo3Title);

  const valueLabel3 = document.createElement('div');
  valueLabel3.textContent = 'Value: 50';
  valueLabel3.style.cssText = 'margin-bottom: 8px; color: var(--text-muted); font-size: 14px;';
  demo3.appendChild(valueLabel3);

  const slider3 = window.createSlider({
    min: 0,
    max: 100,
    step: 10,
    values: 50,
    onChange: (val) => {
      valueLabel3.textContent = `Value: ${Array.isArray(val) ? val.join(' – ') : val}`;
    },
  });

  demo3.appendChild(slider3.getElement());
  container.appendChild(demo3);

  // Demo 4: Disabled slider
  const demo4 = document.createElement('div');
  const demo4Title = document.createElement('h3');
  demo4Title.textContent = 'Disabled Slider';
  demo4Title.style.cssText = 'margin-bottom: 12px; font-size: 16px; font-weight: 600;';
  demo4.appendChild(demo4Title);

  const slider4 = window.createSlider({
    min: 0,
    max: 100,
    step: 5,
    values: 30,
    disabled: true,
  });

  demo4.appendChild(slider4.getElement());
  container.appendChild(demo4);

  // Demo 5: Colorful slider
  const demo5 = document.createElement('div');
  const demo5Title = document.createElement('h3');
  demo5Title.textContent = 'Custom Styled Slider';
  demo5Title.style.cssText = 'margin-bottom: 12px; font-size: 16px; font-weight: 600;';
  demo5.appendChild(demo5Title);

  const valueLabel5 = document.createElement('div');
  valueLabel5.textContent = 'Value: 65';
  valueLabel5.style.cssText = 'margin-bottom: 8px; color: var(--text-muted); font-size: 14px;';
  demo5.appendChild(valueLabel5);

  const slider5 = window.createSlider({
    min: 0,
    max: 100,
    step: 5,
    values: 65,
    onChange: (val) => {
      valueLabel5.textContent = `Value: ${Array.isArray(val) ? val.join(' – ') : val}`;
    },
  });

  // Custom gradient for the range
  const rangeEl = slider5.getElement().querySelector('.slider-range');
  if (rangeEl) {
    rangeEl.style.background = 'linear-gradient(90deg, #10b981 0%, #6366f1 100%)';
  }

  demo5.appendChild(slider5.getElement());
  container.appendChild(demo5);

  console.log('Slider demos initialized successfully');
})();

// ==================== Toaster Component ====================
window.createToaster = function(options = {}) {
  const {
    position = 'top-right',
    duration = 4000,
    maxVisible = 4
  } = options;

  const container = document.createElement('div');
  container.className = 'toast-container';
  container.setAttribute('data-position', position);
  document.body.appendChild(container);

  let counter = 0;

  function removeToast(toastEl, progressTimeout, removeTimeout) {
    if (!toastEl || !toastEl.isConnected) return;
    clearTimeout(progressTimeout);
    clearTimeout(removeTimeout);
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(-6px)';
    setTimeout(() => {
      if (toastEl.isConnected) toastEl.remove();
    }, 180);
  }

  function getIcon(type) {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '⛔';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  }

  function showToast(payload = {}) {
    const {
      title = 'Notification',
      description = '',
      type = 'info',
      actionLabel = '',
      onAction = null,
      duration: customDuration
    } = payload;

    const toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.setAttribute('data-type', type);
    toastEl.setAttribute('data-id', `toast-${++counter}`);

    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.textContent = getIcon(type);

    const content = document.createElement('div');
    content.className = 'toast-content';

    const titleEl = document.createElement('div');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;
    content.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement('div');
      descEl.className = 'toast-description';
      descEl.textContent = description;
      content.appendChild(descEl);
    }

    const actions = document.createElement('div');
    actions.className = 'toast-actions';

    if (actionLabel) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast-action-btn';
      actionBtn.textContent = actionLabel;
      actionBtn.onclick = () => {
        if (typeof onAction === 'function') onAction();
        removeToast(toastEl, progressTimeout, removeTimeout);
      };
      actions.appendChild(actionBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.onclick = () => removeToast(toastEl, progressTimeout, removeTimeout);
    actions.appendChild(closeBtn);

    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    const life = customDuration || duration;
    progress.style.transitionDuration = `${life}ms`;

    const toastBody = document.createElement('div');
    toastBody.style.cssText = 'display: flex; gap: 12px; align-items: flex-start;';
    toastBody.appendChild(icon);
    toastBody.appendChild(content);
    toastBody.appendChild(actions);

    toastEl.appendChild(toastBody);
    toastEl.appendChild(progress);

    // Trim old toasts if exceeding maxVisible
    while (container.children.length >= maxVisible) {
      container.firstChild.remove();
    }

    container.appendChild(toastEl);

    // Kick off progress bar shrink
    const progressTimeout = setTimeout(() => {
      progress.style.width = '0%';
    }, 10);

    const removeTimeout = setTimeout(() => {
      removeToast(toastEl, progressTimeout, removeTimeout);
    }, life);

    return toastEl;
  }

  return {
    show: (message, opts = {}) => {
      if (typeof message === 'string') {
        return showToast({ title: message, ...opts });
      }
      return showToast(message || {});
    },
    success: (msg, opts = {}) => showToast({ title: msg, type: 'success', ...opts }),
    error: (msg, opts = {}) => showToast({ title: msg, type: 'error', ...opts }),
    warning: (msg, opts = {}) => showToast({ title: msg, type: 'warning', ...opts }),
    info: (msg, opts = {}) => showToast({ title: msg, type: 'info', ...opts }),
    destroy: () => {
      container.remove();
    }
  };
};

// Default toaster instance and convenience helper
const defaultToaster = window.createToaster();
window.toast = function(message, opts = {}) {
  return defaultToaster.show(message, opts);
};

// useToast hook-like pattern for vanilla JS
window.useToast = function() {
  return {
    toast: window.toast,
    toasts: [], // For compatibility with React pattern
    dismiss: (id) => { /* implemented via toast lifecycle */ }
  };
};

console.log('Toaster utilities loaded successfully');

// ===== Initialize Toaster Demo =====
(function initToasterDemo() {
  const container = document.getElementById('toasterDemoContainer');
  if (!container) return;

  const demoGrid = document.createElement('div');
  demoGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;';

  const buttons = [
    { label: 'Show Info', type: 'info', desc: 'Just some information.' },
    { label: 'Show Success', type: 'success', desc: 'Operation completed successfully.' },
    { label: 'Show Warning', type: 'warning', desc: 'Be careful with this action.' },
    { label: 'Show Error', type: 'error', desc: 'Something went wrong.' },
  ];

  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.textContent = btn.label;
    button.style.cssText = `
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      color: var(--text-primary);
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
    `;
    button.onmouseover = () => {
      button.style.background = 'var(--bg-secondary)';
      button.style.boxShadow = '0 8px 18px rgba(0,0,0,0.08)';
    };
    button.onmouseout = () => {
      button.style.background = 'var(--bg-primary)';
      button.style.boxShadow = 'none';
      button.style.transform = 'none';
    };
    button.onmousedown = () => button.style.transform = 'translateY(1px)';
    button.onmouseup = () => button.style.transform = 'none';
    button.onclick = () => {
      defaultToaster[btn.type](btn.label, { description: btn.desc });
    };
    demoGrid.appendChild(button);
  });

  // Actionable toast
  const actionBtn = document.createElement('button');
  actionBtn.textContent = 'Show Toast with Action';
  actionBtn.style.cssText = `
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: linear-gradient(90deg, #2563eb, #7c3aed);
    color: #fff;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.1s ease;
  `;
  actionBtn.onmouseover = () => actionBtn.style.opacity = '0.92';
  actionBtn.onmouseout = () => actionBtn.style.opacity = '1';
  actionBtn.onmousedown = () => actionBtn.style.transform = 'translateY(1px)';
  actionBtn.onmouseup = () => actionBtn.style.transform = 'none';
  actionBtn.onclick = () => {
    defaultToaster.info('Action required', {
      description: 'Click the action button to undo.',
      actionLabel: 'Undo',
      onAction: () => {
        defaultToaster.success('Undone', { description: 'Your action was reverted.' });
      },
      duration: 5000
    });
  };

  demoGrid.appendChild(actionBtn);
  container.appendChild(demoGrid);

  console.log('Toaster demos initialized successfully');
})();

// ==================== Switch Component ====================
window.createSwitch = function(options = {}) {
  const {
    checked = false,
    disabled = false,
    label = '',
    onChange = null,
    id = `switch-${Math.random().toString(16).slice(2)}`
  } = options;

  let isChecked = !!checked;
  let isDisabled = !!disabled;
  let changeHandler = onChange;

  const wrapper = document.createElement('label');
  wrapper.style.cssText = 'display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;';
  wrapper.setAttribute('for', id);

  const root = document.createElement('button');
  root.type = 'button';
  root.className = 'switch';
  root.id = id;
  root.setAttribute('role', 'switch');
  root.setAttribute('aria-checked', String(isChecked));
  root.setAttribute('aria-label', label || 'Toggle');
  if (isDisabled) root.setAttribute('data-disabled', 'true');
  if (isChecked) root.setAttribute('data-state', 'checked');
  else root.setAttribute('data-state', 'unchecked');

  const thumb = document.createElement('span');
  thumb.className = 'switch-thumb';
  root.appendChild(thumb);

  function renderState() {
    root.setAttribute('aria-checked', String(isChecked));
    root.setAttribute('data-state', isChecked ? 'checked' : 'unchecked');
    if (isDisabled) root.setAttribute('data-disabled', 'true');
    else root.removeAttribute('data-disabled');
  }

  function emitChange() {
    if (typeof changeHandler === 'function') {
      changeHandler(isChecked);
    }
  }

  function toggle() {
    if (isDisabled) return;
    isChecked = !isChecked;
    renderState();
    emitChange();
  }

  root.addEventListener('click', () => toggle());

  root.addEventListener('keydown', (e) => {
    if (isDisabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  });

  if (label) {
    const text = document.createElement('span');
    text.className = 'switch-label';
    text.textContent = label;
    wrapper.appendChild(root);
    wrapper.appendChild(text);
  } else {
    wrapper.appendChild(root);
  }

  renderState();

  return {
    getElement: () => wrapper,
    isChecked: () => isChecked,
    setChecked: (value) => {
      isChecked = !!value;
      renderState();
      emitChange();
    },
    toggle,
    disable: () => {
      isDisabled = true;
      renderState();
    },
    enable: () => {
      isDisabled = false;
      renderState();
    },
    setOnChange: (handler) => {
      if (typeof handler === 'function') changeHandler = handler;
    }
  };
};

console.log('Switch utilities loaded successfully');

// ===== Initialize Switch Demo =====
(function initSwitchDemo() {
  const container = document.getElementById('switchDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;';

  // Basic switch
  const basic = window.createSwitch({ label: 'Airplane Mode', checked: false });
  container.appendChild(basic.getElement());

  // Checked switch
  const checked = window.createSwitch({ label: 'Notifications', checked: true });
  container.appendChild(checked.getElement());

  // Disabled switch
  const disabled = window.createSwitch({ label: 'Auto Updates', checked: true, disabled: true });
  container.appendChild(disabled.getElement());

  // Switch with handler
  const handlerWrap = document.createElement('div');
  handlerWrap.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';
  const status = document.createElement('div');
  status.textContent = 'Wi-Fi: On';
  status.style.cssText = 'font-size: 14px; color: var(--text-muted);';
  const wifi = window.createSwitch({ label: 'Wi-Fi', checked: true, onChange: (val) => {
    status.textContent = `Wi-Fi: ${val ? 'On' : 'Off'}`;
  }});
  handlerWrap.appendChild(wifi.getElement());
  handlerWrap.appendChild(status);
  container.appendChild(handlerWrap);

  // Compact switch without label (icon only)
  const iconOnlyWrap = document.createElement('div');
  iconOnlyWrap.style.cssText = 'display: flex; align-items: center; gap: 8px;';
  const iconLabel = document.createElement('span');
  iconLabel.textContent = 'Dark Mode';
  iconLabel.style.cssText = 'font-size: 14px;';
  const iconSwitch = window.createSwitch({ checked: false, onChange: (val) => {
    iconLabel.textContent = val ? 'Dark Mode (On)' : 'Dark Mode';
    document.documentElement.dataset.theme = val ? 'dark' : 'light';
  }});
  iconOnlyWrap.appendChild(iconSwitch.getElement());
  iconOnlyWrap.appendChild(iconLabel);
  container.appendChild(iconOnlyWrap);

  console.log('Switch demos initialized successfully');
})();

// ==================== Table Component ====================
window.createTable = function(options = {}) {
  const {
    columns = [],
    data = [],
    caption = '',
    footer = [],
    compact = false,
    ariaLabel = 'Data table',
    getRowId = (row, idx) => (row && row.id !== undefined ? row.id : idx),
    onRowSelect = null,
  } = options;

  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrap';

  const table = document.createElement('table');
  table.className = 'table' + (compact ? ' table-compact' : '');
  table.setAttribute('role', 'table');
  table.setAttribute('aria-label', ariaLabel);

  if (caption) {
    const cap = document.createElement('caption');
    cap.textContent = caption;
    table.appendChild(cap);
  }

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  columns.forEach((col) => {
    const th = document.createElement('th');
    th.textContent = col.header || '';
    if (col.align) th.style.textAlign = col.align;
    if (col.width) th.style.width = typeof col.width === 'number' ? `${col.width}px` : col.width;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  let rows = Array.isArray(data) ? [...data] : [];
  let selectedId = null;

  function renderBody() {
    tbody.innerHTML = '';
    rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      const rowId = getRowId(row, idx);
      if (rowId === selectedId) tr.dataset.state = 'selected';

      columns.forEach((col) => {
        const td = document.createElement('td');
        if (col.align) td.style.textAlign = col.align;
        if (col.className) td.className = col.className;
        const val = typeof col.render === 'function' ? col.render(row, idx) : row[col.key];
        if (val instanceof Node) td.appendChild(val);
        else td.textContent = val ?? '';
        tr.appendChild(td);
      });

      if (typeof onRowSelect === 'function') {
        tr.tabIndex = 0;
        tr.addEventListener('click', () => selectRow(rowId, row));
        tr.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectRow(rowId, row);
          }
        });
      }

      tbody.appendChild(tr);
    });
  }

  function selectRow(rowId, row) {
    selectedId = rowId;
    Array.from(tbody.children).forEach((tr) => tr.removeAttribute('data-state'));
    const match = Array.from(tbody.children).find((tr) => getRowId(rows[Array.from(tbody.children).indexOf(tr)], Array.from(tbody.children).indexOf(tr)) === rowId);
    if (match) match.dataset.state = 'selected';
    if (typeof onRowSelect === 'function') onRowSelect(rowId, row);
  }

  if (footer && footer.length) {
    const tfoot = document.createElement('tfoot');
    const footRow = document.createElement('tr');
    footer.forEach((cell) => {
      const td = document.createElement('td');
      if (cell.colspan) td.colSpan = cell.colspan;
      if (cell.align) td.style.textAlign = cell.align;
      if (cell.className) td.className = cell.className;
      const content = cell.content;
      if (content instanceof Node) td.appendChild(content);
      else td.textContent = content ?? '';
      footRow.appendChild(td);
    });
    tfoot.appendChild(footRow);
    table.appendChild(tfoot);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  wrapper.appendChild(table);

  renderBody();

  return {
    element: wrapper,
    setData(newData = []) {
      rows = Array.isArray(newData) ? [...newData] : [];
      renderBody();
    },
    setSelectedId(id) {
      selectedId = id;
      renderBody();
    },
    getSelectedId() {
      return selectedId;
    }
  };
};

console.log('Table utilities loaded successfully');

// ===== Initialize Table Demo =====
(function initTableDemo() {
  const container = document.getElementById('tableDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  const statusBadge = (status) => {
    const span = document.createElement('span');
    span.className = 'table-badge';
    span.textContent = status;
    if (status === 'Paid' || status === 'Resolved') span.classList.add('success');
    if (status === 'Pending') span.classList.add('warning');
    if (status === 'In Review') span.classList.add('info');
    return span;
  };

  // Orders table
  const ordersColumns = [
    { key: 'invoice', header: 'Invoice' },
    { key: 'customer', header: 'Customer' },
    { key: 'status', header: 'Status', render: (row) => statusBadge(row.status) },
    { key: 'amount', header: 'Amount', align: 'right', className: 'table-number' },
  ];

  const ordersData = [
    { id: 'INV-2045', invoice: 'INV-2045', customer: 'Acme Corp', status: 'Paid', amount: '$2,480.00' },
    { id: 'INV-2044', invoice: 'INV-2044', customer: 'Northwind Traders', status: 'Pending', amount: '$980.00' },
    { id: 'INV-2043', invoice: 'INV-2043', customer: 'Globex', status: 'Paid', amount: '$6,120.00' },
    { id: 'INV-2042', invoice: 'INV-2042', customer: 'Initech', status: 'In Review', amount: '$1,420.00' },
  ];

  const ordersFooter = [
    { content: 'Total', colspan: 3, align: 'right', className: 'table-muted' },
    { content: '$11,000.00', align: 'right', className: 'table-number' },
  ];

  const ordersTable = window.createTable({
    columns: ordersColumns,
    data: ordersData,
    caption: 'Recent invoices from the past week.',
    footer: ordersFooter,
  });

  container.appendChild(ordersTable.element);

  // Compact activity table
  const activityColumns = [
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role', className: 'table-muted' },
    { key: 'activity', header: 'Activity', align: 'right', className: 'table-number' },
  ];

  const activityData = [
    { id: 1, name: 'Alex Carter', role: 'Support', activity: '41 replies' },
    { id: 2, name: 'Dana Lee', role: 'Success', activity: '28 check-ins' },
    { id: 3, name: 'Jordan Smith', role: 'Engineering', activity: '12 fixes' },
    { id: 4, name: 'Priya Patel', role: 'Design', activity: '7 reviews' },
  ];

  const activityTable = window.createTable({
    columns: activityColumns,
    data: activityData,
    caption: 'Team activity snapshot.',
    compact: true,
  });

  container.appendChild(activityTable.element);

  // Selectable tickets table
  const selectionNote = document.createElement('div');
  selectionNote.style.cssText = 'font-size: 14px; color: var(--text-muted); margin-bottom: 8px;';
  selectionNote.textContent = 'Selected ticket: none';

  const ticketColumns = [
    { key: 'ticket', header: 'Ticket' },
    { key: 'customer', header: 'Customer' },
    { key: 'status', header: 'Status', render: (row) => statusBadge(row.status) },
    { key: 'updated', header: 'Updated', align: 'right', className: 'table-muted' },
  ];

  const ticketData = [
    { id: 'TCK-480', ticket: '#480', customer: 'Olivia Martin', status: 'Resolved', updated: '2h ago' },
    { id: 'TCK-479', ticket: '#479', customer: 'Ethan Walker', status: 'Pending', updated: '4h ago' },
    { id: 'TCK-478', ticket: '#478', customer: 'Sofia Chen', status: 'In Review', updated: '1d ago' },
    { id: 'TCK-477', ticket: '#477', customer: 'Liam Davis', status: 'Pending', updated: '3d ago' },
  ];

  const ticketsTable = window.createTable({
    columns: ticketColumns,
    data: ticketData,
    caption: 'Click a row to select a ticket.',
    onRowSelect: (id, row) => {
      selectionNote.textContent = row ? `Selected ticket: ${row.ticket} (${row.status})` : 'Selected ticket: none';
    },
    getRowId: (row) => row.id,
  });

  ticketsTable.setSelectedId(ticketData[0].id);
  selectionNote.textContent = `Selected ticket: ${ticketData[0].ticket} (${ticketData[0].status})`;

  container.appendChild(selectionNote);
  container.appendChild(ticketsTable.element);

  console.log('Table demos initialized successfully');
})();

// ==================== Tabs Component ====================
window.createTabs = function(options = {}) {
  const {
    tabs = [],
    defaultValue,
    onValueChange = null,
    orientation = 'horizontal',
    disabledValues = [],
    ariaLabel = 'Tabs',
  } = options;

  if (!Array.isArray(tabs) || !tabs.length) {
    throw new Error('createTabs requires a tabs array');
  }

  const disabledSet = new Set(disabledValues || []);
  let currentValue = defaultValue || tabs[0].value;

  const root = document.createElement('div');
  root.className = 'tabs';
  root.setAttribute('role', 'tablist');
  root.setAttribute('aria-orientation', orientation);
  root.setAttribute('aria-label', ariaLabel);

  const list = document.createElement('div');
  list.className = 'tabs-list';
  root.appendChild(list);

  const contentWrap = document.createElement('div');
  contentWrap.className = 'tabs-content-wrap';

  const triggers = new Map();
  const panels = new Map();

  tabs.forEach((tab, idx) => {
    const id = tab.value;
    const trigger = document.createElement('button');
    trigger.className = 'tabs-trigger';
    trigger.type = 'button';
    trigger.id = `tab-${id}`;
    trigger.setAttribute('role', 'tab');
    trigger.setAttribute('aria-selected', 'false');
    trigger.setAttribute('aria-controls', `panel-${id}`);
    trigger.textContent = tab.label || id;
    if (disabledSet.has(id)) {
      trigger.setAttribute('aria-disabled', 'true');
      trigger.tabIndex = -1;
    } else {
      trigger.tabIndex = idx === 0 ? 0 : -1;
    }

    trigger.addEventListener('click', () => setValue(id));
    trigger.addEventListener('keydown', (e) => {
      const enabledValues = tabs.map((t) => t.value).filter((v) => !disabledSet.has(v));
      const currentIdx = enabledValues.indexOf(currentValue);
      if (currentIdx === -1) return;
      const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
      const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      if (e.key === prevKey) {
        e.preventDefault();
        const next = enabledValues[(currentIdx - 1 + enabledValues.length) % enabledValues.length];
        setValue(next, true);
      } else if (e.key === nextKey) {
        e.preventDefault();
        const next = enabledValues[(currentIdx + 1) % enabledValues.length];
        setValue(next, true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setValue(enabledValues[0], true);
      } else if (e.key === 'End') {
        e.preventDefault();
        setValue(enabledValues[enabledValues.length - 1], true);
      }
    });

    triggers.set(id, trigger);
    list.appendChild(trigger);

    const panel = document.createElement('div');
    panel.className = 'tabs-content';
    panel.id = `panel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.hidden = true;
    if (tab.content instanceof Node) panel.appendChild(tab.content);
    else panel.textContent = tab.content || '';
    panels.set(id, panel);
    contentWrap.appendChild(panel);
  });

  root.appendChild(contentWrap);

  function render() {
    triggers.forEach((btn, value) => {
      const active = value === currentValue;
      btn.dataset.state = active ? 'active' : 'inactive';
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.tabIndex = disabledSet.has(value) ? -1 : (active ? 0 : -1);
    });
    panels.forEach((panel, value) => {
      panel.hidden = value !== currentValue;
    });
  }

  function setValue(value, focus = false) {
    if (disabledSet.has(value)) return;
    if (!triggers.has(value)) return;
    currentValue = value;
    render();
    if (focus) {
      const trigger = triggers.get(value);
      if (trigger) trigger.focus();
    }
    if (typeof onValueChange === 'function') onValueChange(value);
  }

  // initial render
  render();

  return {
    element: root,
    setValue,
    getValue: () => currentValue,
  };
};

console.log('Tabs utilities loaded successfully');

// ===== Initialize Tabs Demo =====
(function initTabsDemo() {
  const container = document.getElementById('tabsDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));';

  // Profile tabs
  const profileContent = (title, body) => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<h4 style="margin: 0 0 6px; font-size: 16px;">${title}</h4><p style="margin: 0; color: var(--text-muted); font-size: 14px; line-height: 1.5;">${body}</p>`;
    return wrap;
  };

  const profileTabs = window.createTabs({
    tabs: [
      { value: 'account', label: 'Account', content: profileContent('Account Settings', 'Update your name, email, and profile details.') },
      { value: 'password', label: 'Password', content: profileContent('Password', 'Change your password regularly to keep your account secure.') },
      { value: 'notifications', label: 'Notifications', content: profileContent('Notifications', 'Choose how you receive updates across email and mobile.') },
    ],
    defaultValue: 'account',
    onValueChange: (val) => { console.log('Profile tabs changed to', val); }
  });

  const profileCard = document.createElement('div');
  profileCard.style.cssText = 'display: grid; gap: 12px;';
  const profileTitle = document.createElement('div');
  profileTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  profileTitle.textContent = 'Profile Tabs';
  profileCard.appendChild(profileTitle);
  profileCard.appendChild(profileTabs.element);

  // Billing tabs with disabled option
  const billingTabs = window.createTabs({
    tabs: [
      { value: 'summary', label: 'Summary', content: profileContent('Billing Summary', 'See your recent invoices and payment history.') },
      { value: 'plans', label: 'Plans', content: profileContent('Plans', 'Switch between monthly and yearly billing.') },
      { value: 'usage', label: 'Usage', content: profileContent('Usage', 'Track voice minutes, seats, and add-ons.') },
    ],
    defaultValue: 'summary',
    disabledValues: ['usage'],
  });

  const billingCard = document.createElement('div');
  billingCard.style.cssText = 'display: grid; gap: 12px;';
  const billingTitle = document.createElement('div');
  billingTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  billingTitle.textContent = 'Billing Tabs (Usage disabled)';
  billingCard.appendChild(billingTitle);
  billingCard.appendChild(billingTabs.element);

  // Orientation example
  const verticalTabs = window.createTabs({
    tabs: [
      { value: 'overview', label: 'Overview', content: profileContent('Overview', 'High-level view of performance metrics.') },
      { value: 'teams', label: 'Teams', content: profileContent('Teams', 'Manage team members and roles.') },
      { value: 'integrations', label: 'Integrations', content: profileContent('Integrations', 'Connect third-party tools to streamline workflows.') },
    ],
    defaultValue: 'overview',
    orientation: 'vertical',
  });

  verticalTabs.element.style.gridTemplateColumns = '160px 1fr';
  verticalTabs.element.style.alignItems = 'flex-start';
  verticalTabs.element.style.display = 'grid';
  verticalTabs.element.style.columnGap = '12px';
  const vertList = verticalTabs.element.querySelector('.tabs-list');
  if (vertList) {
    vertList.style.flexDirection = 'column';
    vertList.style.height = '100%';
    vertList.style.alignItems = 'stretch';
  }

  const verticalCard = document.createElement('div');
  verticalCard.style.cssText = 'display: grid; gap: 12px;';
  const verticalTitle = document.createElement('div');
  verticalTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  verticalTitle.textContent = 'Vertical Tabs';
  verticalCard.appendChild(verticalTitle);
  verticalCard.appendChild(verticalTabs.element);

  container.appendChild(profileCard);
  container.appendChild(billingCard);
  container.appendChild(verticalCard);

  console.log('Tabs demos initialized successfully');
})();

// ==================== Textarea Component ====================
window.createTextarea = function(options = {}) {
  const {
    label = '',
    placeholder = '',
    value = '',
    disabled = false,
    rows = 4,
    maxLength = null,
    helperText = '',
    onInput = null,
    ariaLabel = 'Textarea',
    resize = 'vertical',
  } = options;

  const wrap = document.createElement('div');
  wrap.className = 'textarea-wrap';

  if (label) {
    const lbl = document.createElement('label');
    lbl.className = 'textarea-label';
    lbl.textContent = label;
    wrap.appendChild(lbl);
  }

  const ta = document.createElement('textarea');
  ta.className = 'textarea';
  ta.rows = rows;
  ta.placeholder = placeholder;
  ta.value = value;
  if (disabled) ta.disabled = true;
  if (maxLength) ta.maxLength = maxLength;
  ta.setAttribute('aria-label', ariaLabel);
  ta.style.resize = resize;
  wrap.appendChild(ta);

  const helper = document.createElement('div');
  helper.className = 'textarea-helper';
  const helperTextEl = document.createElement('span');
  helperTextEl.textContent = helperText;
  const counterEl = document.createElement('span');
  counterEl.textContent = maxLength ? `${ta.value.length}/${maxLength}` : '';
  helper.appendChild(helperTextEl);
  helper.appendChild(counterEl);
  if (helperText || maxLength) {
    wrap.appendChild(helper);
  }

  function renderCounter() {
    if (maxLength) counterEl.textContent = `${ta.value.length}/${maxLength}`;
  }

  ta.addEventListener('input', (e) => {
    renderCounter();
    if (typeof onInput === 'function') onInput(e.target.value, e);
  });

  return {
    element: wrap,
    textarea: ta,
    focus: () => ta.focus(),
    disable: () => { ta.disabled = true; },
    enable: () => { ta.disabled = false; },
    setValue: (val) => { ta.value = val ?? ''; renderCounter(); },
    getValue: () => ta.value,
  };
};

// ==================== NavLink Component ====================
window.createNavLink = function(options = {}) {
  const {
    to = '#',
    label = '',
    className = '',
    activeClassName = 'active',
    pendingClassName = 'pending',
    exact = false,
    isActive = null,
    onClick = null,
  } = options;

  const link = document.createElement('a');
  link.href = to;
  link.className = className;
  link.textContent = label;
  link.style.transition = 'all 0.2s ease';

  function checkActive() {
    const currentPath = window.location.pathname;
    const targetPath = to === '#' ? '#' : to;
    let isLinkActive = false;

    if (typeof isActive === 'function') {
      isLinkActive = isActive(currentPath, targetPath);
    } else if (exact) {
      isLinkActive = currentPath === targetPath;
    } else {
      isLinkActive = currentPath.startsWith(targetPath.replace(/\/$/, ''));
    }

    // Update active state
    if (isLinkActive) {
      link.classList.add(activeClassName);
      link.classList.remove(pendingClassName);
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove(activeClassName);
      link.classList.remove(pendingClassName);
      link.removeAttribute('aria-current');
    }

    return isLinkActive;
  }

  link.addEventListener('click', (e) => {
    if (typeof onClick === 'function') {
      const result = onClick(e, to);
      if (result === false) e.preventDefault();
    }
    // Check active state after navigation
    setTimeout(checkActive, 0);
  });

  // Check initial active state
  checkActive();

  // Listen for popstate (back/forward buttons)
  window.addEventListener('popstate', checkActive);

  return {
    element: link,
    setActive: (active) => {
      if (active) {
        link.classList.add(activeClassName);
        link.classList.remove(pendingClassName);
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove(activeClassName);
        link.classList.remove(pendingClassName);
        link.removeAttribute('aria-current');
      }
    },
    checkActive,
    destroy: () => {
      window.removeEventListener('popstate', checkActive);
    }
  };
};

// ==================== useIsMobile Hook ====================
const MOBILE_BREAKPOINT = 768;
const isMobileListeners = new Set();
let isMobileState = typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false;

function checkIsMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function updateIsMobileState() {
  const newState = checkIsMobile();
  if (newState !== isMobileState) {
    isMobileState = newState;
    isMobileListeners.forEach(listener => listener(isMobileState));
  }
}

// Setup media query listener
if (typeof window !== 'undefined') {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  if (mql.addEventListener) {
    mql.addEventListener('change', updateIsMobileState);
  } else if (mql.addListener) {
    // Fallback for older browsers
    mql.addListener(updateIsMobileState);
  }
  window.addEventListener('resize', updateIsMobileState);
}

window.useIsMobile = function() {
  return {
    isMobile: () => isMobileState,
    subscribe: (callback) => {
      isMobileListeners.add(callback);
      // Call immediately with current state
      callback(isMobileState);
      return () => isMobileListeners.delete(callback);
    }
  };
};

console.log('useIsMobile hook loaded successfully');

// ===== Initialize useIsMobile Demo =====
(function initUseIsMobileDemo() {
  const container = document.getElementById('useIsMobileDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  // Status card
  const statusCard = document.createElement('div');
  statusCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const statusTitle = document.createElement('div');
  statusTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  statusTitle.textContent = 'Mobile Detection';
  statusCard.appendChild(statusTitle);

  const statusDisplay = document.createElement('div');
  statusDisplay.style.cssText = 'padding: 12px; background: rgba(37, 99, 235, 0.08); border-radius: 8px; font-size: 14px; color: var(--text-primary); text-align: center;';
  statusDisplay.innerHTML = `
    <div style="margin-bottom: 8px;">
      <strong>Current Status:</strong>
    </div>
    <div id="isMobileStatus" style="font-size: 16px; font-weight: 600; color: var(--brand-color);">
      Checking...
    </div>
    <div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">
      Viewport Width: <span id="viewportWidth">-</span>px
    </div>
  `;
  statusCard.appendChild(statusDisplay);
  container.appendChild(statusCard);

  // Responsive grid example
  const gridCard = document.createElement('div');
  gridCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const gridTitle = document.createElement('div');
  gridTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  gridTitle.textContent = 'Responsive Grid';
  gridCard.appendChild(gridTitle);

  const grid = document.createElement('div');
  grid.id = 'responsiveGrid';
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;';

  for (let i = 1; i <= 4; i++) {
    const item = document.createElement('div');
    item.style.cssText = 'padding: 16px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color); text-align: center; font-size: 14px;';
    item.textContent = `Card ${i}`;
    grid.appendChild(item);
  }

  gridCard.appendChild(grid);
  container.appendChild(gridCard);

  // Use the hook
  const hook = window.useIsMobile();

  // Update status and grid layout
  function updateLayout() {
    const isMobile = hook.isMobile();
    const statusEl = document.getElementById('isMobileStatus');
    const viewportEl = document.getElementById('viewportWidth');
    const gridEl = document.getElementById('responsiveGrid');

    statusEl.textContent = isMobile ? '📱 Mobile' : '🖥️ Desktop';
    statusEl.style.color = isMobile ? '#f59e0b' : '#2563eb';

    viewportEl.textContent = window.innerWidth;

    if (gridEl) {
      gridEl.style.gridTemplateColumns = isMobile ? '1fr' : 'repeat(2, 1fr)';
    }
  }

  // Subscribe to changes
  hook.subscribe(() => updateLayout());

  // Initial update
  updateLayout();

  // Also update on window resize for real-time viewport width display
  window.addEventListener('resize', () => {
    const viewportEl = document.getElementById('viewportWidth');
    if (viewportEl) viewportEl.textContent = window.innerWidth;
  });

  console.log('useIsMobile demo initialized successfully');
})();

// ==================== useToast Hook (Advanced Toast Management) ====================
const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
};

let toastCount = 0;

function genToastId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
  return toastCount.toString();
}

function toastReducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;
      return {
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t
        ),
      };
    }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return { toasts: [] };
      }
      return {
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
}

const toastTimeouts = new Map();
const toastListeners = new Set();
let toastMemoryState = { toasts: [] };

function addToRemoveQueue(toastId) {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatchToast({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

function dispatchToast(action) {
  toastMemoryState = toastReducer(toastMemoryState, action);
  toastListeners.forEach((listener) => listener(toastMemoryState));
}

window.toast = function({ title, description, duration = 3000, ...props } = {}) {
  const id = genToastId();

  const update = (newProps) =>
    dispatchToast({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...newProps, id },
    });

  const dismiss = () => {
    dispatchToast({ type: actionTypes.DISMISS_TOAST, toastId: id });
    addToRemoveQueue(id);
  };

  dispatchToast({
    type: actionTypes.ADD_TOAST,
    toast: {
      title,
      description,
      id,
      open: true,
      ...props,
    },
  });

  // Auto-dismiss after duration
  if (duration) {
    setTimeout(() => dismiss(), duration);
  }

  return {
    id,
    dismiss,
    update,
  };
};

window.useToast = function() {
  const state = { ...toastMemoryState };
  
  return {
    toasts: state.toasts,
    toast: window.toast,
    dismiss: (toastId) =>
      dispatchToast({ type: actionTypes.DISMISS_TOAST, toastId }),
    subscribe: (callback) => {
      toastListeners.add(callback);
      return () => toastListeners.delete(callback);
    },
  };
};

console.log('useToast hook loaded successfully');

// ===== Initialize useToast Demo =====
(function initUseToastDemo() {
  const container = document.getElementById('useToastDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  // Status display
  const statusCard = document.createElement('div');
  statusCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const statusTitle = document.createElement('div');
  statusTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  statusTitle.textContent = 'Active Toasts';
  statusCard.appendChild(statusTitle);

  const toastList = document.createElement('div');
  toastList.id = 'toastList';
  toastList.style.cssText = 'display: flex; flex-direction: column; gap: 8px; min-height: 60px;';
  toastList.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">No active toasts</div>';
  statusCard.appendChild(toastList);
  container.appendChild(statusCard);

  // Buttons to trigger toasts
  const buttonsCard = document.createElement('div');
  buttonsCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const buttonsTitle = document.createElement('div');
  buttonsTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  buttonsTitle.textContent = 'Create Toasts';
  buttonsCard.appendChild(buttonsTitle);

  const buttonsGrid = document.createElement('div');
  buttonsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px;';

  const toastHook = window.useToast();
  
  // Subscribe to updates
  toastHook.subscribe((state) => {
    const list = document.getElementById('toastList');
    if (state.toasts.length === 0) {
      list.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">No active toasts</div>';
    } else {
      list.innerHTML = state.toasts
        .map(
          (t) => `
        <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px; border-left: 3px solid var(--brand-color); font-size: 13px;">
          <div style="font-weight: 600;">${t.title || 'Toast'}</div>
          ${t.description ? `<div style="color: var(--text-muted); font-size: 12px;">${t.description}</div>` : ''}
        </div>
      `
        )
        .join('');
    }
  });

  const createToastBtn = (label, config) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-primary);
      cursor: pointer;
      font-weight: 500;
      font-size: 13px;
      transition: all 0.15s ease;
    `;
    btn.onmouseover = () => {
      btn.style.background = 'var(--brand-color)';
      btn.style.color = '#fff';
      btn.style.borderColor = 'var(--brand-color)';
    };
    btn.onmouseout = () => {
      btn.style.background = 'var(--bg-secondary)';
      btn.style.color = 'var(--text-primary)';
      btn.style.borderColor = 'var(--border-color)';
    };
    btn.onclick = () => toastHook.toast(config);
    return btn;
  };

  buttonsGrid.appendChild(
    createToastBtn('Info', { title: 'Info', description: 'This is an info toast', duration: 3000 })
  );
  buttonsGrid.appendChild(
    createToastBtn('Success', { title: 'Success', description: 'Operation completed!', duration: 3000 })
  );
  buttonsGrid.appendChild(
    createToastBtn('Warning', { title: 'Warning', description: 'Please review this action', duration: 3000 })
  );
  buttonsGrid.appendChild(
    createToastBtn('Error', { title: 'Error', description: 'Something went wrong', duration: 3000 })
  );
  buttonsGrid.appendChild(
    createToastBtn('Long Duration', { title: 'Important', description: 'This lasts 8 seconds', duration: 8000 })
  );
  buttonsGrid.appendChild(
    createToastBtn('Dismiss All', { title: 'Cleared', description: 'All toasts dismissed' })
  );

  buttonsCard.appendChild(buttonsGrid);
  container.appendChild(buttonsCard);

  console.log('useToast demo initialized successfully');
})();

// ==================== useTheme Hook ====================
const THEME_KEY = 'theme';
const LIGHT_THEME = 'light';
const DARK_THEME = 'dark';

window.useTheme = function() {
  // Initialize theme from localStorage or system preference
  const initTheme = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === DARK_THEME || stored === LIGHT_THEME) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
    }
    return DARK_THEME;
  };

  let currentTheme = initTheme();
  const themeListeners = new Set();

  // Apply theme to document
  const applyTheme = (theme) => {
    const root = window.document.documentElement;
    root.classList.remove(LIGHT_THEME, DARK_THEME);
    root.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
    // Notify all listeners
    themeListeners.forEach(cb => cb(theme));
  };

  // Apply initial theme
  applyTheme(currentTheme);

  return {
    theme: currentTheme,
    setTheme: (theme) => {
      if (theme !== LIGHT_THEME && theme !== DARK_THEME) return;
      currentTheme = theme;
      applyTheme(theme);
    },
    toggleTheme: () => {
      currentTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
      applyTheme(currentTheme);
    },
    subscribe: (callback) => {
      themeListeners.add(callback);
      return () => themeListeners.delete(callback);
    },
  };
};

console.log('useTheme hook loaded successfully');

// ===== Initialize useTheme Demo =====
(function initUseThemeDemo() {
  const container = document.getElementById('useThemeDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  // Status display
  const statusCard = document.createElement('div');
  statusCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const statusTitle = document.createElement('div');
  statusTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  statusTitle.textContent = 'Current Theme';
  statusCard.appendChild(statusTitle);

  const statusDisplay = document.createElement('div');
  statusDisplay.id = 'currentThemeDisplay';
  statusDisplay.style.cssText = 'padding: 12px; background: var(--bg-secondary); border-radius: 8px; border-left: 3px solid var(--brand-color); font-size: 14px; font-weight: 500; text-transform: capitalize;';
  statusCard.appendChild(statusDisplay);
  container.appendChild(statusCard);

  // Control buttons
  const controlsCard = document.createElement('div');
  controlsCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const controlsTitle = document.createElement('div');
  controlsTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  controlsTitle.textContent = 'Theme Controls';
  controlsCard.appendChild(controlsTitle);

  const buttonsGrid = document.createElement('div');
  buttonsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;';

  const themeHook = window.useTheme();

  // Subscribe to theme changes
  themeHook.subscribe((theme) => {
    statusDisplay.textContent = `Theme: ${theme}`;
    statusDisplay.style.borderLeftColor = theme === DARK_THEME ? '#8b5cf6' : '#f59e0b';
  });

  // Update initial display
  statusDisplay.textContent = `Theme: ${themeHook.theme}`;

  const createThemeBtn = (label, action) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-primary);
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.15s ease;
    `;
    btn.onmouseover = () => {
      btn.style.background = 'var(--brand-color)';
      btn.style.color = '#fff';
      btn.style.borderColor = 'var(--brand-color)';
    };
    btn.onmouseout = () => {
      btn.style.background = 'var(--bg-secondary)';
      btn.style.color = 'var(--text-primary)';
      btn.style.borderColor = 'var(--border-color)';
    };
    btn.onclick = action;
    return btn;
  };

  buttonsGrid.appendChild(
    createThemeBtn('🌙 Dark', () => themeHook.setTheme(DARK_THEME))
  );
  buttonsGrid.appendChild(
    createThemeBtn('☀️ Light', () => themeHook.setTheme(LIGHT_THEME))
  );
  buttonsGrid.appendChild(
    createThemeBtn('🔄 Toggle', () => themeHook.toggleTheme())
  );

  controlsCard.appendChild(buttonsGrid);
  container.appendChild(controlsCard);

  // Info card
  const infoCard = document.createElement('div');
  infoCard.style.cssText = 'display: grid; gap: 10px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const infoTitle = document.createElement('div');
  infoTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  infoTitle.textContent = 'Theme Information';
  infoCard.appendChild(infoTitle);

  const infoText = document.createElement('div');
  infoText.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
  infoText.innerHTML = `
    <div>• Theme is persisted to localStorage</div>
    <div>• Defaults to system preference (prefers-color-scheme)</div>
    <div>• All connected components reactively update</div>
    <div>• Subscribe to theme changes for custom updates</div>
  `;
  infoCard.appendChild(infoText);
  container.appendChild(infoCard);

  console.log('useTheme demo initialized successfully');
})();

// ===== Initialize cn Utility Demo =====
(function initCnDemo() {
  const container = document.getElementById('cnDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  // Example 1: Basic class composition
  const basicCard = document.createElement('div');
  basicCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const basicTitle = document.createElement('div');
  basicTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  basicTitle.textContent = 'Basic Composition';
  basicCard.appendChild(basicTitle);

  const basicExample = document.createElement('div');
  basicExample.style.cssText = 'font-family: monospace; font-size: 13px; background: var(--bg-secondary); padding: 10px; border-radius: 6px; border-left: 3px solid var(--brand-color); overflow-x: auto;';
  basicExample.innerHTML = `
<div style="color: var(--text-muted); margin-bottom: 8px;">// Combining strings and conditional classes</div>
<div>cn('px-2 py-1', true && 'bg-blue-500', false && 'bg-red-500')</div>
<div style="color: var(--brand-color); margin-top: 8px;">→ "px-2 py-1 bg-blue-500"</div>
  `;
  basicCard.appendChild(basicExample);
  container.appendChild(basicCard);

  // Example 2: Tailwind conflict resolution
  const conflictCard = document.createElement('div');
  conflictCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const conflictTitle = document.createElement('div');
  conflictTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  conflictTitle.textContent = 'Conflict Resolution';
  conflictCard.appendChild(conflictTitle);

  const conflictExample = document.createElement('div');
  conflictExample.style.cssText = 'font-family: monospace; font-size: 13px; background: var(--bg-secondary); padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6; overflow-x: auto;';
  conflictExample.innerHTML = `
<div style="color: var(--text-muted); margin-bottom: 8px;">// Duplicate/conflicting Tailwind classes</div>
<div>cn('w-10 w-20', 'p-2 p-4')</div>
<div style="color: #8b5cf6; margin-top: 8px;">→ "w-20 p-4"  (keeps last)</div>
  `;
  conflictCard.appendChild(conflictExample);
  container.appendChild(conflictCard);

  // Example 3: Object syntax
  const objectCard = document.createElement('div');
  objectCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const objectTitle = document.createElement('div');
  objectTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  objectTitle.textContent = 'Object Syntax';
  objectCard.appendChild(objectTitle);

  const objectExample = document.createElement('div');
  objectExample.style.cssText = 'font-family: monospace; font-size: 13px; background: var(--bg-secondary); padding: 10px; border-radius: 6px; border-left: 3px solid #10b981; overflow-x: auto;';
  objectExample.innerHTML = `
<div style="color: var(--text-muted); margin-bottom: 8px;">// Using objects for conditional classes</div>
<div>cn({</div>
<div>&nbsp;&nbsp;'bg-blue-500': true,</div>
<div>&nbsp;&nbsp;'text-white': true,</div>
<div>&nbsp;&nbsp;'opacity-50': false</div>
<div>})</div>
<div style="color: #10b981; margin-top: 8px;">→ "bg-blue-500 text-white"</div>
  `;
  objectCard.appendChild(objectExample);
  container.appendChild(objectCard);

  // Example 4: Array syntax
  const arrayCard = document.createElement('div');
  arrayCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const arrayTitle = document.createElement('div');
  arrayTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  arrayTitle.textContent = 'Array Syntax';
  arrayCard.appendChild(arrayTitle);

  const arrayExample = document.createElement('div');
  arrayExample.style.cssText = 'font-family: monospace; font-size: 13px; background: var(--bg-secondary); padding: 10px; border-radius: 6px; border-left: 3px solid #f59e0b; overflow-x: auto;';
  arrayExample.innerHTML = `
<div style="color: var(--text-muted); margin-bottom: 8px;">// Flattening nested arrays</div>
<div>cn(['px-4', ['py-2', 'rounded']], 'bg-slate')</div>
<div style="color: #f59e0b; margin-top: 8px;">→ "px-4 py-2 rounded bg-slate"</div>
  `;
  arrayCard.appendChild(arrayExample);
  container.appendChild(arrayCard);

  // Interactive demo
  const interactiveCard = document.createElement('div');
  interactiveCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const interactiveTitle = document.createElement('div');
  interactiveTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  interactiveTitle.textContent = 'Interactive Test';
  interactiveCard.appendChild(interactiveTitle);

  const inputRow = document.createElement('div');
  inputRow.style.cssText = 'display: grid; gap: 8px;';
  
  const inputLabel = document.createElement('label');
  inputLabel.style.cssText = 'font-weight: 500; font-size: 13px;';
  inputLabel.textContent = 'Try composing classes (comma-separated):';
  inputRow.appendChild(inputLabel);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'e.g., w-10, w-20, p-4, text-white';
  input.style.cssText = 'padding: 8px 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-family: monospace; font-size: 13px;';
  inputRow.appendChild(input);
  interactiveCard.appendChild(inputRow);

  const output = document.createElement('div');
  output.style.cssText = 'padding: 10px 12px; background: var(--bg-secondary); border-radius: 6px; border-left: 3px solid var(--brand-color); font-family: monospace; font-size: 13px; word-break: break-all;';
  output.textContent = 'Result will appear here...';
  interactiveCard.appendChild(output);

  input.addEventListener('input', () => {
    const classes = input.value.split(',').map(s => s.trim()).filter(Boolean);
    if (classes.length === 0) {
      output.textContent = 'Result will appear here...';
      output.style.color = 'var(--text-muted)';
    } else {
      try {
        const result = window.cn(...classes);
        output.textContent = result || '(empty result)';
        output.style.color = result ? 'var(--brand-color)' : 'var(--text-muted)';
      } catch (e) {
        output.textContent = `Error: ${e.message}`;
        output.style.color = '#ef4444';
      }
    }
  });

  container.appendChild(interactiveCard);

  console.log('cn demo initialized successfully');
})();

console.log('NavLink utilities loaded successfully');

// ===== Initialize NavLink Demo =====
(function initNavLinkDemo() {
  const container = document.getElementById('navLinkDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  // Navigation list demo
  const navCard = document.createElement('div');
  navCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const navTitle = document.createElement('div');
  navTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  navTitle.textContent = 'Navigation Links';
  navCard.appendChild(navTitle);

  const nav = document.createElement('nav');
  nav.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

  const routes = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/products', label: 'Products', icon: '📦' },
    { to: '/tickets', label: 'Support Tickets', icon: '🎫' },
    { to: '/calls', label: 'Call History', icon: '📞' },
  ];

  routes.forEach((route) => {
    const navLink = window.createNavLink({
      to: route.to,
      label: `${route.icon} ${route.label}`,
      className: 'nav-link-item',
      activeClassName: 'nav-link-active',
      exact: true,
    });

    navLink.element.style.cssText = `
      padding: 10px 12px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      text-align: left;
      display: block;
    `;

    navLink.element.addEventListener('mouseenter', () => {
      if (!navLink.element.classList.contains('nav-link-active')) {
        navLink.element.style.background = 'rgba(148, 163, 184, 0.12)';
        navLink.element.style.color = 'var(--text-primary)';
      }
    });

    navLink.element.addEventListener('mouseleave', () => {
      if (!navLink.element.classList.contains('nav-link-active')) {
        navLink.element.style.background = 'transparent';
        navLink.element.style.color = 'var(--text-muted)';
      }
    });

    // Add active styles
    const updateStyles = () => {
      if (navLink.element.classList.contains('nav-link-active')) {
        navLink.element.style.background = 'var(--brand-color)';
        navLink.element.style.color = '#fff';
        navLink.element.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
      } else {
        navLink.element.style.background = 'transparent';
        navLink.element.style.color = 'var(--text-muted)';
        navLink.element.style.boxShadow = 'none';
      }
    };

    const observer = new MutationObserver(updateStyles);
    observer.observe(navLink.element, { attributes: true, attributeFilter: ['class'] });

    updateStyles();

    nav.appendChild(navLink.element);
  });

  navCard.appendChild(nav);
  container.appendChild(navCard);

  console.log('NavLink demos initialized successfully');
})();

console.log('NavLink utilities loaded successfully');

console.log('Textarea utilities loaded successfully');

// ===== Initialize Textarea Demo =====
(function initTextareaDemo() {
  const container = document.getElementById('textareaDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;';

  // Basic
  const basic = window.createTextarea({
    label: 'Message',
    placeholder: 'Type your message...'
  });
  const basicCard = document.createElement('div');
  basicCard.style.cssText = 'display: grid; gap: 10px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  basicCard.appendChild(basic.element);
  container.appendChild(basicCard);

  // With helper and counter
  const feedback = window.createTextarea({
    label: 'Feedback',
    placeholder: 'Share your thoughts about the new dashboard...',
    maxLength: 200,
    helperText: 'Max 200 characters',
    onInput: (val) => {
      // Optionally react to input
      if (val.length > 180) {
        feedback.textarea.style.borderColor = '#f59e0b';
      } else {
        feedback.textarea.style.borderColor = '';
      }
    }
  });
  const feedbackCard = document.createElement('div');
  feedbackCard.style.cssText = 'display: grid; gap: 10px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  feedbackCard.appendChild(feedback.element);
  container.appendChild(feedbackCard);

  // Disabled
  const disabled = window.createTextarea({
    label: 'Disabled',
    value: 'Textarea is disabled',
    disabled: true,
  });
  const disabledCard = document.createElement('div');
  disabledCard.style.cssText = 'display: grid; gap: 10px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  disabledCard.appendChild(disabled.element);
  container.appendChild(disabledCard);

  console.log('Textarea demos initialized successfully');
})();

// ==================== Toggle Group Component ====================
window.createToggleGroup = function(options = {}) {
  const {
    type = 'single', // 'single' or 'multiple'
    items = [],
    defaultValue,
    defaultValues = [],
    disabledValues = [],
    size = 'default', // 'default' | 'sm' | 'lg'
    variant = 'default', // 'default' | 'ghost' | 'soft'
    ariaLabel = 'Toggle group',
    onChange = null,
  } = options;

  if (!Array.isArray(items) || !items.length) {
    throw new Error('createToggleGroup requires an items array');
  }

  const isMultiple = type === 'multiple';
  const disabledSet = new Set(disabledValues || []);
  let currentValue = defaultValue !== undefined ? defaultValue : items[0].value;
  let currentValues = new Set(Array.isArray(defaultValues) ? defaultValues : []);

  // Normalize for single type
  if (!isMultiple && currentValue === undefined) currentValue = items[0].value;

  const root = document.createElement('div');
  root.className = 'toggle-group' + (variant === 'soft' ? ' soft' : '');
  root.setAttribute('role', isMultiple ? 'group' : 'radiogroup');
  root.setAttribute('aria-label', ariaLabel);

  const btns = new Map();

  function createButton(item, idx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toggle';
    if (size === 'sm') btn.classList.add('toggle-sm');
    if (size === 'lg') btn.classList.add('toggle-lg');
    if (variant === 'ghost') btn.classList.add('toggle-ghost');
    btn.dataset.value = item.value;
    btn.textContent = item.label ?? item.value;
    if (disabledSet.has(item.value)) {
      btn.setAttribute('aria-disabled', 'true');
      btn.tabIndex = -1;
    } else {
      btn.tabIndex = idx === 0 ? 0 : -1;
    }
    btn.addEventListener('click', () => toggleValue(item.value));
    btn.addEventListener('keydown', (e) => handleKey(e, item.value));
    return btn;
  }

  function handleKey(e, value) {
    const enabledValues = items.map((it) => it.value).filter((v) => !disabledSet.has(v));
    const idx = enabledValues.indexOf(isMultiple ? value : currentValue);
    if (idx === -1) return;
    const prevKey = 'ArrowLeft';
    const nextKey = 'ArrowRight';
    if (e.key === prevKey || e.key === nextKey) {
      e.preventDefault();
      const next = enabledValues[(idx + (e.key === nextKey ? 1 : -1) + enabledValues.length) % enabledValues.length];
      if (!isMultiple) setValue(next, true);
    }
    if (!isMultiple && (e.key === 'Home' || e.key === 'End')) {
      e.preventDefault();
      setValue(e.key === 'Home' ? enabledValues[0] : enabledValues[enabledValues.length - 1], true);
    }
    if (!isMultiple && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setValue(value, true);
    }
  }

  function render() {
    btns.forEach((btn, val) => {
      const isOn = isMultiple ? currentValues.has(val) : currentValue === val;
      btn.dataset.state = isOn ? 'on' : 'off';
      btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      if (!disabledSet.has(val)) {
        btn.tabIndex = isMultiple ? 0 : (isOn ? 0 : -1);
      }
    });
  }

  function toggleValue(val) {
    if (disabledSet.has(val)) return;
    if (isMultiple) {
      if (currentValues.has(val)) currentValues.delete(val);
      else currentValues.add(val);
      render();
      if (typeof onChange === 'function') onChange(Array.from(currentValues));
    } else {
      if (currentValue === val) return;
      currentValue = val;
      render();
      if (typeof onChange === 'function') onChange(val);
    }
  }

  function setValue(val, focus = false) {
    if (isMultiple) return;
    if (disabledSet.has(val) || !btns.has(val)) return;
    currentValue = val;
    render();
    if (focus) {
      const btn = btns.get(val);
      if (btn) btn.focus();
    }
    if (typeof onChange === 'function') onChange(val);
  }

  function setValues(vals = []) {
    if (!isMultiple) return;
    currentValues = new Set(vals.filter((v) => !disabledSet.has(v)));
    render();
    if (typeof onChange === 'function') onChange(Array.from(currentValues));
  }

  items.forEach((item, idx) => {
    const btn = createButton(item, idx);
    btns.set(item.value, btn);
    root.appendChild(btn);
  });

  render();

  return {
    element: root,
    getValue: () => (isMultiple ? Array.from(currentValues) : currentValue),
    setValue,
    setValues,
  };
};

console.log('Toggle Group utilities loaded successfully');

// ===== Initialize Toggle Group Demo =====
(function initToggleGroupDemo() {
  const container = document.getElementById('toggleGroupDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;';

  // Multiple selection (formatting)
  const formatGroup = window.createToggleGroup({
    type: 'multiple',
    items: [
      { value: 'bold', label: 'Bold' },
      { value: 'italic', label: 'Italic' },
      { value: 'underline', label: 'Underline' },
    ],
    defaultValues: ['bold'],
  });

  const formatCard = document.createElement('div');
  formatCard.style.cssText = 'display: grid; gap: 10px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const formatTitle = document.createElement('div');
  formatTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  formatTitle.textContent = 'Formatting (multiple)';
  formatCard.appendChild(formatTitle);
  formatCard.appendChild(formatGroup.element);
  container.appendChild(formatCard);

  // Single selection (alignment)
  const alignGroup = window.createToggleGroup({
    type: 'single',
    items: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ],
    defaultValue: 'center',
    variant: 'soft',
  });

  const alignCard = document.createElement('div');
  alignCard.style.cssText = 'display: grid; gap: 10px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const alignTitle = document.createElement('div');
  alignTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  alignTitle.textContent = 'Text alignment (single)';
  alignCard.appendChild(alignTitle);
  alignCard.appendChild(alignGroup.element);
  container.appendChild(alignCard);

  // Size + ghost variant example
  const sizeGroup = window.createToggleGroup({
    type: 'single',
    items: [
      { value: 'sm', label: 'S' },
      { value: 'md', label: 'M' },
      { value: 'lg', label: 'L' },
    ],
    defaultValue: 'md',
    size: 'sm',
    variant: 'ghost',
  });

  const sizeCard = document.createElement('div');
  sizeCard.style.cssText = 'display: grid; gap: 10px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const sizeTitle = document.createElement('div');
  sizeTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  sizeTitle.textContent = 'Sizes & variant';
  sizeCard.appendChild(sizeTitle);
  sizeCard.appendChild(sizeGroup.element);
  container.appendChild(sizeCard);

  // Disabled buttons example
  const disabledGroup = window.createToggleGroup({
    type: 'multiple',
    items: [
      { value: 'micro', label: 'Micro' },
      { value: 'small', label: 'Small' },
      { value: 'enterprise', label: 'Enterprise' },
    ],
    defaultValues: ['small'],
    disabledValues: ['enterprise'],
  });

  const disabledCard = document.createElement('div');
  disabledCard.style.cssText = 'display: grid; gap: 10px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const disabledTitle = document.createElement('div');
  disabledTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  disabledTitle.textContent = 'Disabled options';
  disabledCard.appendChild(disabledTitle);
  disabledCard.appendChild(disabledGroup.element);
  container.appendChild(disabledCard);

  console.log('Toggle Group demos initialized successfully');
})();

// ==================== Toggle Component (Single) ====================
window.createToggle = function(options = {}) {
  const {
    label = '',
    pressed = false,
    disabled = false,
    variant = 'default', // 'default' | 'outline'
    size = 'default', // 'sm' | 'default' | 'lg'
    ariaLabel = 'Toggle',
    ariaPressed = null,
    onPressedChange = null,
  } = options;

  let isPressed = !!pressed;
  let isDisabled = !!disabled;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'toggle-btn';
  if (size === 'sm') btn.classList.add('toggle-btn-sm');
  if (size === 'lg') btn.classList.add('toggle-btn-lg');
  if (variant === 'outline') btn.classList.add('toggle-btn-outline');
  btn.textContent = label || ariaLabel;
  btn.setAttribute('aria-label', ariaLabel);
  btn.setAttribute('aria-pressed', ariaPressed !== null ? ariaPressed : String(isPressed));
  if (isDisabled) btn.setAttribute('aria-disabled', 'true');
  else btn.removeAttribute('aria-disabled');

  function renderState() {
    btn.dataset.state = isPressed ? 'on' : 'off';
    btn.setAttribute('aria-pressed', String(isPressed));
    if (isDisabled) btn.setAttribute('aria-disabled', 'true');
    else btn.removeAttribute('aria-disabled');
  }

  function emitChange() {
    if (typeof onPressedChange === 'function') {
      onPressedChange(isPressed);
    }
  }

  function toggle() {
    if (isDisabled) return;
    isPressed = !isPressed;
    renderState();
    emitChange();
  }

  btn.addEventListener('click', toggle);
  btn.addEventListener('keydown', (e) => {
    if (isDisabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  });

  renderState();

  return {
    element: btn,
    isPressed: () => isPressed,
    setPressed: (value) => {
      isPressed = !!value;
      renderState();
      emitChange();
    },
    toggle,
    disable: () => {
      isDisabled = true;
      renderState();
    },
    enable: () => {
      isDisabled = false;
      renderState();
    },
    setOnPressedChange: (handler) => {
      if (typeof handler === 'function') onPressedChange = handler;
    }
  };
};

console.log('Toggle utilities loaded successfully');

// ===== Initialize Toggle Demo =====
(function initToggleDemo() {
  const container = document.getElementById('toggleDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;';

  // Default variants
  const defaultCard = document.createElement('div');
  defaultCard.style.cssText = 'display: grid; gap: 12px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const defaultTitle = document.createElement('div');
  defaultTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  defaultTitle.textContent = 'Default Variant';
  defaultCard.appendChild(defaultTitle);

  const defaultBtns = document.createElement('div');
  defaultBtns.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';
  
  const toggleDefault = window.createToggle({ label: 'Toggle', ariaLabel: 'Toggle button' });
  defaultBtns.appendChild(toggleDefault.element);
  
  const toggleDefaultPressed = window.createToggle({ label: 'Pressed', pressed: true, ariaLabel: 'Pressed toggle' });
  defaultBtns.appendChild(toggleDefaultPressed.element);
  
  const toggleDefaultDisabled = window.createToggle({ label: 'Disabled', disabled: true, ariaLabel: 'Disabled toggle' });
  defaultBtns.appendChild(toggleDefaultDisabled.element);
  
  defaultCard.appendChild(defaultBtns);
  container.appendChild(defaultCard);

  // Outline variant
  const outlineCard = document.createElement('div');
  outlineCard.style.cssText = 'display: grid; gap: 12px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const outlineTitle = document.createElement('div');
  outlineTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  outlineTitle.textContent = 'Outline Variant';
  outlineCard.appendChild(outlineTitle);

  const outlineBtns = document.createElement('div');
  outlineBtns.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';
  
  const toggleOutline = window.createToggle({ label: 'Outline', variant: 'outline', ariaLabel: 'Outline toggle' });
  outlineBtns.appendChild(toggleOutline.element);
  
  const toggleOutlinePressed = window.createToggle({ label: 'Active', pressed: true, variant: 'outline', ariaLabel: 'Active outline toggle' });
  outlineBtns.appendChild(toggleOutlinePressed.element);
  
  const toggleOutlineDisabled = window.createToggle({ label: 'Disabled', variant: 'outline', disabled: true, ariaLabel: 'Disabled outline toggle' });
  outlineBtns.appendChild(toggleOutlineDisabled.element);
  
  outlineCard.appendChild(outlineBtns);
  container.appendChild(outlineCard);

  // Sizes
  const sizesCard = document.createElement('div');
  sizesCard.style.cssText = 'display: grid; gap: 12px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const sizesTitle = document.createElement('div');
  sizesTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  sizesTitle.textContent = 'Sizes';
  sizesCard.appendChild(sizesTitle);

  const sizesBtns = document.createElement('div');
  sizesBtns.style.cssText = 'display: flex; flex-wrap: wrap; align-items: center; gap: 8px;';
  
  const toggleSmall = window.createToggle({ label: 'Small', size: 'sm', ariaLabel: 'Small toggle' });
  sizesBtns.appendChild(toggleSmall.element);
  
  const toggleDefault2 = window.createToggle({ label: 'Default', size: 'default', ariaLabel: 'Default size toggle' });
  sizesBtns.appendChild(toggleDefault2.element);
  
  const toggleLarge = window.createToggle({ label: 'Large', size: 'lg', pressed: true, ariaLabel: 'Large toggle' });
  sizesBtns.appendChild(toggleLarge.element);
  
  sizesCard.appendChild(sizesBtns);
  container.appendChild(sizesCard);

  // Interactive example
  const interactiveCard = document.createElement('div');
  interactiveCard.style.cssText = 'display: grid; gap: 12px; padding: 12px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  const interactiveTitle = document.createElement('div');
  interactiveTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  interactiveTitle.textContent = 'Interactive & Callback';
  interactiveCard.appendChild(interactiveTitle);

  const status = document.createElement('div');
  status.style.cssText = 'padding: 8px 12px; background: rgba(37, 99, 235, 0.08); border-radius: 8px; font-size: 14px; color: var(--text-primary);';
  status.textContent = 'Status: Off';
  interactiveCard.appendChild(status);

  const interactiveToggle = window.createToggle({
    label: 'Click to toggle',
    ariaLabel: 'Interactive toggle',
    onPressedChange: (pressed) => {
      status.textContent = `Status: ${pressed ? 'On' : 'Off'}`;
      status.style.background = pressed ? 'rgba(34, 197, 94, 0.12)' : 'rgba(37, 99, 235, 0.08)';
      status.style.color = pressed ? '#15803d' : 'var(--text-primary)';
    }
  });
  interactiveCard.appendChild(interactiveToggle.element);

  container.appendChild(interactiveCard);

  console.log('Toggle demos initialized successfully');
})();

// ==================== Tooltip Component ====================
window.createTooltip = function(options = {}) {
  const {
    content = '',
    side = 'top', // 'top' | 'bottom' | 'left' | 'right'
    delay = 200,
    closeDelay = 100,
    showArrow = true,
    dark = false,
    sideOffset = 8,
  } = options;

  if (!content) {
    throw new Error('createTooltip requires content');
  }

  let isOpen = false;
  let openTimer = null;
  let closeTimer = null;

  const trigger = document.createElement('span');
  trigger.className = 'tooltip-trigger' + (dark ? ' tooltip-dark' : '');
  trigger.setAttribute('role', 'button');
  trigger.setAttribute('aria-describedby', `tooltip-${Math.random().toString(16).slice(2)}`);
  trigger.tabIndex = 0;

  const tooltipId = trigger.getAttribute('aria-describedby');

  const contentEl = document.createElement('div');
  contentEl.id = tooltipId;
  contentEl.className = 'tooltip-content';
  contentEl.setAttribute('role', 'tooltip');
  contentEl.dataset.side = side;
  if (typeof content === 'string') contentEl.textContent = content;
  else if (content instanceof Node) contentEl.appendChild(content);

  if (showArrow) {
    const arrow = document.createElement('div');
    arrow.className = 'tooltip-arrow';
    contentEl.appendChild(arrow);
  }

  document.body.appendChild(contentEl);

  function clearTimers() {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  }

  function position() {
    const rect = trigger.getBoundingClientRect();
    const cw = contentEl.offsetWidth;
    const ch = contentEl.offsetHeight;
    let x = rect.left, y = rect.top;

    if (side === 'top') {
      y = rect.top - ch - sideOffset;
      x = rect.left + (rect.width - cw) / 2;
    } else if (side === 'bottom') {
      y = rect.bottom + sideOffset;
      x = rect.left + (rect.width - cw) / 2;
    } else if (side === 'left') {
      x = rect.left - cw - sideOffset;
      y = rect.top + (rect.height - ch) / 2;
    } else if (side === 'right') {
      x = rect.right + sideOffset;
      y = rect.top + (rect.height - ch) / 2;
    }

    // Boundary guards
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    x = Math.max(8, Math.min(x, vw - cw - 8));
    y = Math.max(8, Math.min(y, vh - ch - 8));

    contentEl.style.left = `${Math.round(x)}px`;
    contentEl.style.top = `${Math.round(y)}px`;
  }

  function open() {
    clearTimers();
    openTimer = setTimeout(() => {
      if (isOpen) return;
      isOpen = true;
      contentEl.classList.add('show');
      position();
      trigger.setAttribute('aria-expanded', 'true');
    }, delay);
  }

  function close() {
    clearTimers();
    closeTimer = setTimeout(() => {
      if (!isOpen) return;
      isOpen = false;
      contentEl.classList.remove('show');
      trigger.setAttribute('aria-expanded', 'false');
    }, closeDelay);
  }

  // Events
  trigger.addEventListener('mouseenter', open);
  trigger.addEventListener('mouseleave', close);
  trigger.addEventListener('focus', open);
  trigger.addEventListener('blur', close);

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!trigger.contains(e.target) && !contentEl.contains(e.target)) {
      close();
    }
  });

  // Reposition on scroll/resize
  const reposition = () => { if (isOpen) position(); };
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);

  return {
    trigger,
    contentEl,
    open,
    close,
    destroy() {
      clearTimers();
      trigger.removeEventListener('mouseenter', open);
      trigger.removeEventListener('mouseleave', close);
      trigger.removeEventListener('focus', open);
      trigger.removeEventListener('blur', close);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      if (contentEl.parentNode) contentEl.parentNode.removeChild(contentEl);
    }
  };
};

console.log('Tooltip utilities loaded successfully');

// ===== Initialize Tooltip Demo =====
(function initTooltipDemo() {
  const container = document.getElementById('tooltipDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 40px;';

  // Positioning example
  const posCard = document.createElement('div');
  posCard.style.cssText = 'display: grid; gap: 16px;';
  const posTitle = document.createElement('div');
  posTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  posTitle.textContent = 'Tooltip Positioning';
  posCard.appendChild(posTitle);

  const posGrid = document.createElement('div');
  posGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 40px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  ['top', 'bottom', 'left', 'right'].forEach((pos) => {
    const tt = window.createTooltip({ content: `Positioned at ${pos}`, side: pos });
    tt.trigger.textContent = `Hover for ${pos}`;
    tt.trigger.style.cssText = 'padding: 8px 12px; background: var(--brand-color); color: white; border-radius: 6px; cursor: pointer; user-select: none;';
    posGrid.appendChild(tt.trigger);
  });

  posCard.appendChild(posGrid);
  container.appendChild(posCard);

  // Delay variations
  const delayCard = document.createElement('div');
  delayCard.style.cssText = 'display: grid; gap: 16px;';
  const delayTitle = document.createElement('div');
  delayTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  delayTitle.textContent = 'Delay Variations';
  delayCard.appendChild(delayTitle);

  const delayGrid = document.createElement('div');
  delayGrid.style.cssText = 'display: flex; flex-wrap: wrap; gap: 16px; padding: 24px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  [
    { delay: 0, label: 'No delay' },
    { delay: 500, label: '500ms delay' },
    { delay: 1000, label: '1s delay' }
  ].forEach(({ delay, label }) => {
    const tt = window.createTooltip({ 
      content: `Opens after ${delay}ms`, 
      delay, 
      side: 'top' 
    });
    tt.trigger.textContent = label;
    tt.trigger.style.cssText = 'padding: 8px 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; user-select: none;';
    delayGrid.appendChild(tt.trigger);
  });

  delayCard.appendChild(delayGrid);
  container.appendChild(delayCard);

  // Dark variant
  const darkCard = document.createElement('div');
  darkCard.style.cssText = 'display: grid; gap: 16px;';
  const darkTitle = document.createElement('div');
  darkTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  darkTitle.textContent = 'Dark Variant';
  darkCard.appendChild(darkTitle);

  const darkGrid = document.createElement('div');
  darkGrid.style.cssText = 'display: flex; gap: 16px; padding: 24px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  const ttLight = window.createTooltip({ 
    content: 'Light tooltip (default)', 
    dark: false, 
    side: 'top' 
  });
  ttLight.trigger.textContent = 'Light';
  ttLight.trigger.style.cssText = 'padding: 8px 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; user-select: none;';
  darkGrid.appendChild(ttLight.trigger);

  const ttDark = window.createTooltip({ 
    content: 'Dark tooltip variant', 
    dark: true, 
    side: 'top' 
  });
  ttDark.trigger.textContent = 'Dark';
  ttDark.trigger.style.cssText = 'padding: 8px 12px; background: var(--brand-color); color: white; border-radius: 6px; cursor: pointer; user-select: none;';
  darkGrid.appendChild(ttDark.trigger);

  darkCard.appendChild(darkGrid);
  container.appendChild(darkCard);

  // Rich content example
  const richCard = document.createElement('div');
  richCard.style.cssText = 'display: grid; gap: 16px;';
  const richTitle = document.createElement('div');
  richTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
  richTitle.textContent = 'Rich Content';
  richCard.appendChild(richTitle);

  const richContent = document.createElement('div');
  richContent.style.cssText = 'display: flex; gap: 16px; padding: 24px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  const richHtml = document.createElement('div');
  richHtml.innerHTML = '<strong>Enhanced Tooltip</strong><br/><span style="font-size: 12px; opacity: 0.8;">With formatted text</span>';
  const ttRich = window.createTooltip({ content: richHtml, side: 'top' });
  ttRich.trigger.textContent = 'Rich HTML';
  ttRich.trigger.style.cssText = 'padding: 8px 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; user-select: none;';
  richContent.appendChild(ttRich.trigger);

  richCard.appendChild(richContent);
  container.appendChild(richCard);

  console.log('Tooltip demos initialized successfully');
})();

// ===== Initialize Pagination Demo =====

(function initPaginationDemo() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPaginationDemo);
  } else {
    setupPaginationDemo();
  }

  function setupPaginationDemo() {
    // Demo 1: Main interactive pagination (20 pages)
    const container1 = document.getElementById('paginationDemo');
    const currentPageDisplay = document.getElementById('currentPageDisplay');
    if (container1) {
      let currentPage1 = 1;
      const totalPages1 = 20;

      function renderPagination1() {
        container1.innerHTML = '';
        const pagination = buildPagination({
          currentPage: currentPage1,
          totalPages: totalPages1,
          siblingCount: 1,
          showPrevNext: true,
          onPageChange: (page) => {
            currentPage1 = page;
            if (currentPageDisplay) {
              currentPageDisplay.textContent = page;
            }
            renderPagination1();
            if (window.showNotification) {
              window.showNotification(`Navigated to page ${page}`);
            }
          }
        });
        container1.appendChild(pagination);
      }

      renderPagination1();
    }

    // Demo 2: Small dataset (5 pages)
    const container2 = document.getElementById('paginationDemo2');
    if (container2) {
      let currentPage2 = 3;
      const totalPages2 = 5;

      function renderPagination2() {
        container2.innerHTML = '';
        const pagination = buildPagination({
          currentPage: currentPage2,
          totalPages: totalPages2,
          siblingCount: 1,
          showPrevNext: true,
          onPageChange: (page) => {
            currentPage2 = page;
            renderPagination2();
            if (window.showNotification) {
              window.showNotification(`Small dataset: Page ${page} of ${totalPages2}`);
            }
          }
        });
        container2.appendChild(pagination);
      }

      renderPagination2();
    }

    // Demo 3: Large dataset (100 pages, starting at page 50)
    const container3 = document.getElementById('paginationDemo3');
    if (container3) {
      let currentPage3 = 50;
      const totalPages3 = 100;

      function renderPagination3() {
        container3.innerHTML = '';
        const pagination = buildPagination({
          currentPage: currentPage3,
          totalPages: totalPages3,
          siblingCount: 1,
          showPrevNext: true,
          onPageChange: (page) => {
            currentPage3 = page;
            renderPagination3();
            if (window.showNotification) {
              window.showNotification(`Large dataset: Page ${page} of ${totalPages3}`);
            }
          }
        });
        container3.appendChild(pagination);
      }

      renderPagination3();
    }
  }
})();
// ==================== Main Index Component ====================
// Orchestrates the entire dashboard layout, state management, and component lifecycle
// Similar to React's Index component - manages sections, theme, and global state

(function initIndex() {
  // State management
  const state = {
    activeSection: 'products', // products | tickets | call-logs
    theme: null, // Initialized by useTheme
  };

  // Initialize theme using useTheme hook
  const themeHook = window.useTheme();
  state.theme = themeHook.theme;

  // Subscribe to theme changes
  themeHook.subscribe((newTheme) => {
    state.theme = newTheme;
    console.log('Theme changed to:', newTheme);
  });

  // Section rendering logic
  const renderSection = (sectionName) => {
    console.log('Rendering section:', sectionName);
    // In a real app, this would load content from components
    // For now, demo sections are auto-initialized by their demo functions
  };

  // Handle section changes (triggered by sidebar nav)
  const handleSectionChange = (sectionName) => {
    if (state.activeSection === sectionName) return;
    
    state.activeSection = sectionName;
    console.log('Active section changed to:', sectionName);
    
    // Update sidebar active state
    updateNavItemsActiveState(sectionName);
    
    // Render the section
    renderSection(sectionName);
    
    // Show confirmation toast
    const sectionLabels = {
      'products': 'Products',
      'tickets': 'Support Tickets',
      'call-logs': 'Call Logs'
    };
    if (window.toast) {
      window.toast({\n        title: sectionLabels[sectionName] || 'Section',\n        description: `Navigated to ${sectionLabels[sectionName]}`,\n        duration: 2000\n      });\n    }\n  };\n\n  // Update navigation item active states\n  const updateNavItemsActiveState = (sectionName) => {\n    const navItems = document.querySelectorAll('.nav-item');\n    navItems.forEach(item => {\n      const section = item.dataset.section;\n      if (section === sectionName) {\n        item.classList.add('nav-item-active');\n        item.setAttribute('aria-current', 'page');\n      } else {\n        item.classList.remove('nav-item-active');\n        item.removeAttribute('aria-current');\n      }\n    });\n  };\n\n  // Setup navigation event listeners\n  const setupNavigation = () => {\n    const navItems = document.querySelectorAll('.nav-item');\n    navItems.forEach(item => {\n      item.addEventListener('click', () => {\n        const section = item.dataset.section;\n        if (section) {\n          handleSectionChange(section);\n        }\n      });\n    });\n    // Set initial active state\n    updateNavItemsActiveState(state.activeSection);\n  };\n\n  // Setup theme toggle button\n  const setupThemeToggle = () => {\n    const themeBtn = document.getElementById('themeToggleBtn');\n    if (themeBtn) {\n      themeBtn.addEventListener('click', () => {\n        themeHook.toggleTheme();\n      });\n    }\n  };\n\n  // Handle voice call widget end\n  const handleCallEnd = () => {\n    if (window.toast) {\n      window.toast({\n        title: 'Call Ended',\n        description: 'Call ended successfully',\n        duration: 3000\n      });\n    }\n  };\n\n  // Close mobile sidebar on section change\n  const closeMobileSidebar = () => {\n    const sidebar = document.querySelector('.sidebar');\n    const overlay = document.querySelector('.mobile-overlay');\n    if (sidebar) sidebar.classList.remove('mobile-open');\n    if (overlay) overlay.classList.remove('active');\n  };\n\n  // Initialize\n  const initialize = () => {\n    console.log('Initializing Index component...');\n    \n    setupNavigation();\n    setupThemeToggle();\n    \n    // Listen for section changes and close mobile sidebar\n    const navItems = document.querySelectorAll('.nav-item');\n    navItems.forEach(item => {\n      item.addEventListener('click', closeMobileSidebar);\n    });\n    \n    // Expose API to window\n    window.dashboardState = state;\n    window.handleSectionChange = handleSectionChange;\n    window.handleCallEnd = handleCallEnd;\n    \n    console.log('Index component initialized successfully');\n  };\n\n  // Auto-initialize on document ready\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', initialize);\n  } else {\n    initialize();\n  }\n})();\n\nconsole.log('Index component utilities loaded successfully');

// ==================== NotFound (404) Component ====================
// Handles missing routes and displays a 404 error page

window.createNotFoundPage = function(options = {}) {
  const {
    pathname = window.location.pathname,
    onReturnHome = null,
  } = options;

  // Log 404 error
  console.error(`404 Error: User attempted to access non-existent route: ${pathname}`);

  // Create container
  const container = document.createElement('div');
  container.className = 'not-found-page';
  container.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--bg-primary);
    padding: 24px;
  `;

  // Content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = `
    text-align: center;
    max-width: 500px;
  `;

  // 404 heading
  const heading = document.createElement('h1');
  heading.style.cssText = `
    font-size: 64px;
    font-weight: 700;
    margin: 0 0 20px 0;
    color: var(--text-primary);
    line-height: 1;
  `;
  heading.textContent = '404';
  contentWrapper.appendChild(heading);

  // Error message
  const message = document.createElement('p');
  message.style.cssText = `
    font-size: 20px;
    font-weight: 500;
    margin: 0 0 20px 0;
    color: var(--text-muted);
  `;
  message.textContent = 'Oops! Page not found';
  contentWrapper.appendChild(message);

  // Path info
  const pathInfo = document.createElement('p');
  pathInfo.style.cssText = `
    font-size: 14px;
    color: var(--text-muted);
    margin: 0 0 32px 0;
    word-break: break-all;
  `;
  pathInfo.innerHTML = `The page <code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px;">${pathname}</code> does not exist.`;
  contentWrapper.appendChild(pathInfo);

  // Return home link
  const link = document.createElement('a');
  link.href = '/';
  link.style.cssText = `
    display: inline-block;
    padding: 10px 24px;
    background: var(--brand-color);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
  `;
  link.textContent = 'Return to Home';
  link.addEventListener('mouseover', () => {
    link.style.background = 'var(--brand-hover)';
    link.style.transform = 'translateY(-2px)';
  });
  link.addEventListener('mouseout', () => {
    link.style.background = 'var(--brand-color)';
    link.style.transform = 'translateY(0)';
  });
  link.addEventListener('click', (e) => {
    if (onReturnHome) {
      e.preventDefault();
      onReturnHome();
    }
  });
  contentWrapper.appendChild(link);

  container.appendChild(contentWrapper);

  return {
    element: container,
    pathname,
    show() {
      // Clear main content and show 404
      const main = document.querySelector('main.main');
      if (main) {
        main.innerHTML = '';
        main.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    },
    destroy() {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };
};

console.log('NotFound component utilities loaded successfully');

// ===== Initialize NotFound Demo =====
(function initNotFoundDemo() {
  const container = document.getElementById('notFoundDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  // Demo card
  const demoCard = document.createElement('div');
  demoCard.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  // Info
  const info = document.createElement('div');
  info.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
  info.innerHTML = `
    <div style="margin-bottom: 12px;">The NotFound component handles 404 errors and missing routes. It:</div>
    <div>• Logs the failed pathname to console</div>
    <div>• Displays a centered 404 message</div>
    <div>• Provides a return-to-home link</div>
    <div>• Integrates with your routing system</div>
  `;
  demoCard.appendChild(info);

  // Trigger buttons
  const buttonsGrid = document.createElement('div');
  buttonsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;';

  const createDemoBtn = (label, path) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-primary);
      cursor: pointer;
      font-weight: 500;
      font-size: 13px;
      transition: all 0.15s ease;
    `;
    btn.onmouseover = () => {
      btn.style.background = 'var(--brand-color)';
      btn.style.color = '#fff';
      btn.style.borderColor = 'var(--brand-color)';
    };
    btn.onmouseout = () => {
      btn.style.background = 'var(--bg-secondary)';
      btn.style.color = 'var(--text-primary)';
      btn.style.borderColor = 'var(--border-color)';
    };
    btn.onclick = () => {
      const notFound = window.createNotFoundPage({
        pathname: path,
        onReturnHome: () => {
          if (window.toast) {
            window.toast({
              title: 'Returned Home',
              description: 'Navigated back to dashboard',
              duration: 2000
            });
          }
          // Reset view
          location.reload();
        }
      });
      notFound.show();
      console.log('NotFound demo triggered for path:', path);
    };
    return btn;
  };

  buttonsGrid.appendChild(createDemoBtn('/admin', '/admin'));
  buttonsGrid.appendChild(createDemoBtn('/settings', '/settings'));
  buttonsGrid.appendChild(createDemoBtn('/profile/xyz', '/profile/xyz'));
  buttonsGrid.appendChild(createDemoBtn('/api/missing', '/api/missing'));

  demoCard.appendChild(buttonsGrid);
  container.appendChild(demoCard);

  // Code example
  const codeCard = document.createElement('div');
  codeCard.style.cssText = 'display: grid; gap: 10px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
  
  const codeTitle = document.createElement('div');
  codeTitle.style.cssText = 'font-weight: 600; font-size: 13px; color: var(--text-primary);';
  codeTitle.textContent = 'Usage Example';
  codeCard.appendChild(codeTitle);

  const code = document.createElement('pre');
  code.style.cssText = 'margin: 0; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 12px; color: var(--text-primary); overflow-x: auto;';
  code.innerHTML = `<code>// Create and display 404 page
const notFound = window.createNotFoundPage({
  pathname: '/unknown-route',
  onReturnHome: () => {
    console.log('User clicked return home');
  }
});

notFound.show();  // Display the page
notFound.destroy();  // Clean up when done</code>`;
  codeCard.appendChild(code);

  container.appendChild(codeCard);

  console.log('NotFound demo initialized successfully');
})();

// ==================== PostCSS Config Demo ====================
(function initPostcssConfigDemo() {
  const container = document.getElementById('postcssConfigDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  const card = document.createElement('div');
  card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
  desc.innerHTML = `
    <div>Transforms CSS with Tailwind utility generation and vendor prefixes.</div>
    <div>Part of the modern CSS tooling pipeline for production builds.</div>
  `;
  card.appendChild(desc);

  const codeBlock = document.createElement('pre');
  codeBlock.style.cssText = 'margin: 0; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 12px; color: var(--text-primary); overflow-x: auto; line-height: 1.5;';
  codeBlock.innerHTML = `<code><span style="color: #8b5cf6;">export default</span> {
  <span style="color: #0f172a;">plugins</span>: {
    <span style="color: #1d4ed8;">tailwindcss</span>: {},
    <span style="color: #1d4ed8;">autoprefixer</span>: {},
  },
};</code>`;
  card.appendChild(codeBlock);

  const features = document.createElement('div');
  features.style.cssText = 'display: grid; gap: 8px; font-size: 13px;';
  features.innerHTML = `
    <div style="display: flex; gap: 8px; align-items: center;">
      <span style="color: #22c55e; font-weight: 600;">✓</span>
      <span>Tailwind CSS plugin – generates utility classes</span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <span style="color: #22c55e; font-weight: 600;">✓</span>
      <span>Autoprefixer – adds vendor prefixes for cross-browser support</span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <span style="color: #22c55e; font-weight: 600;">✓</span>
      <span>Part of build pipeline – runs during vite build</span>
    </div>
  `;
  card.appendChild(features);

  container.appendChild(card);

  console.log('PostCSS config demo initialized successfully');
})();

// ==================== Tailwind CSS Config Demo ====================
(function initTailwindConfigDemo() {
  const container = document.getElementById('tailwindConfigDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  const card = document.createElement('div');
  card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
  desc.innerHTML = `
    <div>Defines the complete design system: colors, animations, spacing, and component structure.</div>
    <div>Includes dark mode support, theme extensions, and shadcn/ui color tokens via CSS variables.</div>
  `;
  card.appendChild(desc);

  const configSections = document.createElement('div');
  configSections.style.cssText = 'display: grid; gap: 8px; font-size: 12px;';

  const sections = [
    { label: 'Dark Mode', value: 'class-based toggle' },
    { label: 'Colors', value: 'CSS variable based (primary, secondary, destructive, etc.)' },
    { label: 'Animations', value: 'accordion-down/up, fade-in, slide-up, scale-in, shimmer' },
    { label: 'Keyframes', value: 'Smooth transitions, CSS animations for UI feedback' },
    { label: 'Container', value: 'Centered, 2rem padding, max 1400px at 2xl breakpoint' },
    { label: 'Plugin', value: 'tailwindcss-animate for built-in animation utilities' },
  ];

  sections.forEach(section => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color);';
    row.innerHTML = `
      <span style="font-weight: 600; color: var(--text-primary); min-width: 100px;">${section.label}</span>
      <span style="color: var(--text-muted);">${section.value}</span>
    `;
    configSections.appendChild(row);
  });

  card.appendChild(configSections);

  const codeBlock = document.createElement('pre');
  codeBlock.style.cssText = 'margin: 12px 0 0 0; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 11px; color: var(--text-primary); overflow-x: auto; line-height: 1.4;';
  codeBlock.innerHTML = `<code><span style="color: #8b5cf6;">export default</span> {
  <span style="color: #0f172a;">darkMode</span>: [<span style="color: #16a34a;">"class"</span>],
  <span style="color: #0f172a;">content</span>: [<span style="color: #16a34a;">"./src/**/*.{ts,tsx}"</span>],
  <span style="color: #0f172a;">theme</span>: {
    <span style="color: #0f172a;">extend</span>: {
      <span style="color: #0f172a;">colors</span>: {
        <span style="color: #0f172a;">primary</span>: <span style="color: #16a34a;">"hsl(var(--primary))"</span>,
        <span style="color: #0f172a;">secondary</span>: <span style="color: #16a34a;">"hsl(var(--secondary))"</span>,
      },
      <span style="color: #0f172a;">animation</span>: {
        <span style="color: #16a34a;">"fade-in"</span>: <span style="color: #16a34a;">"fade-in 0.4s ease-out"</span>,
      },
    },
  },
};</code>`;
  card.appendChild(codeBlock);

  container.appendChild(card);

  console.log('Tailwind config demo initialized successfully');
})();

// ==================== TypeScript Config Demo ====================
(function initTypescriptConfigDemo() {
  const container = document.getElementById('typescriptConfigDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  const card = document.createElement('div');
  card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
  desc.innerHTML = `
    <div>Strict type checking for React + Vite development with path aliases.</div>
    <div>Target ES2020, supports JSX, bundler module resolution, and Vitest globals.</div>
  `;
  card.appendChild(desc);

  const compilerOptions = document.createElement('div');
  compilerOptions.style.cssText = 'display: grid; gap: 8px; font-size: 12px;';

  const options = [
    { label: 'Target', value: 'ES2020' },
    { label: 'Module', value: 'ESNext' },
    { label: 'JSX', value: 'react-jsx' },
    { label: 'Module Resolution', value: 'bundler (Vite/Rollup)' },
    { label: 'Strict Mode', value: 'false (relaxed)' },
    { label: 'Path Aliases', value: '@/* → ./src/*' },
    { label: 'Types', value: 'vitest/globals' },
  ];

  options.forEach(opt => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color);';
    row.innerHTML = `
      <span style="font-weight: 600; color: var(--text-primary); min-width: 110px;">${opt.label}</span>
      <span style="color: var(--text-muted);">${opt.value}</span>
    `;
    compilerOptions.appendChild(row);
  });

  card.appendChild(compilerOptions);

  const codeBlock = document.createElement('pre');
  codeBlock.style.cssText = 'margin: 12px 0 0 0; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 11px; color: var(--text-primary); overflow-x: auto; line-height: 1.4;';
  codeBlock.innerHTML = `<code>{
  <span style="color: #0f172a;">"compilerOptions"</span>: {
    <span style="color: #0f172a;">"target"</span>: <span style="color: #16a34a;">"ES2020"</span>,
    <span style="color: #0f172a;">"lib"</span>: [<span style="color: #16a34a;">"ES2020"</span>, <span style="color: #16a34a;">"DOM"</span>],
    <span style="color: #0f172a;">"module"</span>: <span style="color: #16a34a;">"ESNext"</span>,
    <span style="color: #0f172a;">"jsx"</span>: <span style="color: #16a34a;">"react-jsx"</span>,
    <span style="color: #0f172a;">"moduleResolution"</span>: <span style="color: #16a34a;">"bundler"</span>,
    <span style="color: #0f172a;">"strict"</span>: <span style="color: #8b5cf6;">false</span>,
    <span style="color: #0f172a;">"paths"</span>: {
      <span style="color: #16a34a;">"@/*"</span>: [<span style="color: #16a34a;">"./src/*"</span>]
    }
  },
  <span style="color: #0f172a;">"include"</span>: [<span style="color: #16a34a;">"src"</span>]
}</code>`;
  card.appendChild(codeBlock);

  container.appendChild(card);

  console.log('TypeScript config demo initialized successfully');
})();

// ==================== TypeScript Base Config Demo (Composite) ====================
(function initTypescriptBaseConfigDemo() {
  const container = document.getElementById('typescriptBaseConfigDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  const card = document.createElement('div');
  card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
  desc.innerHTML = `
    <div>Composite TypeScript setup: base config extends separate configs for app and build tools.</div>
    <div>References: tsconfig.app.json (application code) and tsconfig.node.json (build scripts).</div>
  `;
  card.appendChild(desc);

  const structure = document.createElement('div');
  structure.style.cssText = 'display: grid; gap: 8px; font-size: 12px;';

  const sections = [
    { label: 'Base', value: 'Root tsconfig.json' },
    { label: 'App Config', value: 'tsconfig.app.json (src/ code)' },
    { label: 'Node Config', value: 'tsconfig.node.json (build tools, vite.config, eslint.config)' },
    { label: 'Path Aliases', value: '@/* → ./src/*' },
    { label: 'Common Options', value: 'baseUrl, noImplicitAny: false, skipLibCheck: true' },
    { label: 'Pattern', value: 'Composite config for monorepo/multi-context projects' },
  ];

  sections.forEach(section => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color);';
    row.innerHTML = `
      <span style="font-weight: 600; color: var(--text-primary); min-width: 120px;">${section.label}</span>
      <span style="color: var(--text-muted);">${section.value}</span>
    `;
    structure.appendChild(row);
  });

  card.appendChild(structure);

  const codeBlock = document.createElement('pre');
  codeBlock.style.cssText = 'margin: 12px 0 0 0; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 11px; color: var(--text-primary); overflow-x: auto; line-height: 1.4;';
  codeBlock.innerHTML = `<code>{
  <span style="color: #0f172a;">"files"</span>: [],
  <span style="color: #0f172a;">"references"</span>: [
    { <span style="color: #0f172a;">"path"</span>: <span style="color: #16a34a;">"./tsconfig.app.json"</span> },
    { <span style="color: #0f172a;">"path"</span>: <span style="color: #16a34a;">"./tsconfig.node.json"</span> }
  ],
  <span style="color: #0f172a;">"compilerOptions"</span>: {
    <span style="color: #0f172a;">"baseUrl"</span>: <span style="color: #16a34a;">"."</span>,
    <span style="color: #0f172a;">"paths"</span>: {
      <span style="color: #16a34a;">"@/*"</span>: [<span style="color: #16a34a;">"./src/*"</span>]
    },
    <span style="color: #0f172a;">"skipLibCheck"</span>: <span style="color: #8b5cf6;">true</span>
  }
}</code>`;
  card.appendChild(codeBlock);

  container.appendChild(card);

  console.log('TypeScript base config demo initialized successfully');
})();

// ==================== TypeScript Node Config Demo ====================
(function initTypescriptNodeConfigDemo() {
  const container = document.getElementById('typescriptNodeConfigDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  const card = document.createElement('div');
  card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
  desc.innerHTML = `
    <div>Strict TypeScript configuration for build tools and node-based scripts.</div>
    <div>Covers vite.config.ts, eslint.config.js, and other tooling with higher standards.</div>
  `;
  card.appendChild(desc);

  const features = document.createElement('div');
  features.style.cssText = 'display: grid; gap: 8px; font-size: 12px;';

  const items = [
    { label: 'Target', value: 'ES2022 (modern Node.js)' },
    { label: 'Library', value: 'ES2023' },
    { label: 'Module', value: 'ESNext' },
    { label: 'Strict Mode', value: 'true (enforced)' },
    { label: 'Module Resolution', value: 'bundler' },
    { label: 'Includes', value: 'vite.config.ts' },
    { label: 'Case Handling', value: 'noFallthroughCasesInSwitch: true' },
  ];

  items.forEach(item => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color);';
    row.innerHTML = `
      <span style="font-weight: 600; color: var(--text-primary); min-width: 130px;">${item.label}</span>
      <span style="color: var(--text-muted);">${item.value}</span>
    `;
    features.appendChild(row);
  });

  card.appendChild(features);

  const codeBlock = document.createElement('pre');
  codeBlock.style.cssText = 'margin: 12px 0 0 0; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 11px; color: var(--text-primary); overflow-x: auto; line-height: 1.4;';
  codeBlock.innerHTML = `<code>{
  <span style="color: #0f172a;">"compilerOptions"</span>: {
    <span style="color: #0f172a;">"target"</span>: <span style="color: #16a34a;">"ES2022"</span>,
    <span style="color: #0f172a;">"lib"</span>: [<span style="color: #16a34a;">"ES2023"</span>],
    <span style="color: #0f172a;">"module"</span>: <span style="color: #16a34a;">"ESNext"</span>,
    <span style="color: #0f172a;">"strict"</span>: <span style="color: #8b5cf6;">true</span>,
    <span style="color: #0f172a;">"moduleResolution"</span>: <span style="color: #16a34a;">"bundler"</span>,
    <span style="color: #0f172a;">"noEmit"</span>: <span style="color: #8b5cf6;">true</span>
  },
  <span style="color: #0f172a;">"include"</span>: [<span style="color: #16a34a;">"vite.config.ts"</span>]
}</code>`;
  card.appendChild(codeBlock);

  container.appendChild(card);

  console.log('TypeScript node config demo initialized successfully');
})();

// ==================== Vite Config Demo ====================
(function initViteConfigDemo() {
  const container = document.getElementById('viteConfigDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  const card = document.createElement('div');
  card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
  desc.innerHTML = `
    <div>Ultra-fast build tool and dev server for modern web development.</div>
    <div>Configured for React with SWC transpiler, HMR, and component tagging in dev mode.</div>
  `;
  card.appendChild(desc);

  const features = document.createElement('div');
  features.style.cssText = 'display: grid; gap: 8px; font-size: 12px;';

  const items = [
    { label: 'React Plugin', value: '@vitejs/plugin-react-swc (faster than Babel)' },
    { label: 'Dev Server', value: 'port 8080, IPv6 ready (::)' },
    { label: 'HMR', value: 'Hot Module Replacement enabled, overlay disabled' },
    { label: 'Path Alias', value: '@/ → ./src/' },
    { label: 'Dev Tools', value: 'componentTagger for Lovable integration' },
    { label: 'Mode Detection', value: 'defineConfig with mode-aware plugins' },
  ];

  items.forEach(item => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color);';
    row.innerHTML = `
      <span style="font-weight: 600; color: var(--text-primary); min-width: 140px;">${item.label}</span>
      <span style="color: var(--text-muted);">${item.value}</span>
    `;
    features.appendChild(row);
  });

  card.appendChild(features);

  const codeBlock = document.createElement('pre');
  codeBlock.style.cssText = 'margin: 12px 0 0 0; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 11px; color: var(--text-primary); overflow-x: auto; line-height: 1.4;';
  codeBlock.innerHTML = `<code><span style="color: #8b5cf6;">import</span> { <span style="color: #0f172a;">defineConfig</span> } <span style="color: #8b5cf6;">from</span> <span style="color: #16a34a;">"vite"</span>;
<span style="color: #8b5cf6;">import</span> <span style="color: #0f172a;">react</span> <span style="color: #8b5cf6;">from</span> <span style="color: #16a34a;">"@vitejs/plugin-react-swc"</span>;

<span style="color: #8b5cf6;">export default</span> <span style="color: #0f172a;">defineConfig</span>(({ <span style="color: #0f172a;">mode</span> }) => ({
  <span style="color: #0f172a;">server</span>: { <span style="color: #0f172a;">port</span>: <span style="color: #d97706;">8080</span> },
  <span style="color: #0f172a;">plugins</span>: [<span style="color: #0f172a;">react</span>()],
  <span style="color: #0f172a;">resolve</span>: {
    <span style="color: #0f172a;">alias</span>: { <span style="color: #16a34a;">"@"</span>: <span style="color: #16a34a;">"/src"</span> }
  }
}));</code>`;
  card.appendChild(codeBlock);

  container.appendChild(card);

  console.log('Vite config demo initialized successfully');
})();

// ==================== Vitest Config Demo ====================
(function initVitestConfigDemo() {
  const container = document.getElementById('vitestConfigDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  const card = document.createElement('div');
  card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
  desc.innerHTML = `
    <div>Modern unit testing framework with native ES modules and jsdom support.</div>
    <div>Configured for React component testing with global test utilities and setup files.</div>
  `;
  card.appendChild(desc);

  const features = document.createElement('div');
  features.style.cssText = 'display: grid; gap: 8px; font-size: 12px;';

  const items = [
    { label: 'Environment', value: 'jsdom (DOM simulation for React tests)' },
    { label: 'Globals', value: 'true (describe, it, expect available globally)' },
    { label: 'Setup Files', value: './src/test/setup.ts (shared test configuration)' },
    { label: 'Test Pattern', value: 'src/**/*.{test,spec}.{ts,tsx}' },
    { label: 'React Plugin', value: '@vitejs/plugin-react-swc' },
    { label: 'Path Alias', value: '@/ → ./src/' },
  ];

  items.forEach(item => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color);';
    row.innerHTML = `
      <span style="font-weight: 600; color: var(--text-primary); min-width: 140px;">${item.label}</span>
      <span style="color: var(--text-muted);">${item.value}</span>
    `;
    features.appendChild(row);
  });

  card.appendChild(features);

  const codeBlock = document.createElement('pre');
  codeBlock.style.cssText = 'margin: 12px 0 0 0; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 11px; color: var(--text-primary); overflow-x: auto; line-height: 1.4;';
  codeBlock.innerHTML = `<code><span style="color: #8b5cf6;">import</span> { <span style="color: #0f172a;">defineConfig</span> } <span style="color: #8b5cf6;">from</span> <span style="color: #16a34a;">"vitest/config"</span>;
<span style="color: #8b5cf6;">import</span> <span style="color: #0f172a;">react</span> <span style="color: #8b5cf6;">from</span> <span style="color: #16a34a;">"@vitejs/plugin-react-swc"</span>;

<span style="color: #8b5cf6;">export default</span> <span style="color: #0f172a;">defineConfig</span>({
  <span style="color: #0f172a;">plugins</span>: [<span style="color: #0f172a;">react</span>()],
  <span style="color: #0f172a;">test</span>: {
    <span style="color: #0f172a;">environment</span>: <span style="color: #16a34a;">"jsdom"</span>,
    <span style="color: #0f172a;">globals</span>: <span style="color: #8b5cf6;">true</span>,
    <span style="color: #0f172a;">setupFiles</span>: [<span style="color: #16a34a;">"./src/test/setup.ts"</span>]
  },
  <span style="color: #0f172a;">resolve</span>: {
    <span style="color: #0f172a;">alias</span>: { <span style="color: #16a34a;">"@"</span>: <span style="color: #16a34a;">"/src"</span> }
  }
});</code>`;
  card.appendChild(codeBlock);

  container.appendChild(card);

  console.log('Vitest config demo initialized successfully');
})();

// ==================== Example Test (Vitest-style) ====================
// Minimal test utility to mirror the Vitest example

window.runExampleTest = function() {
  const testName = 'example should pass';
  const expected = true;
  const received = true;
  const passed = expected === received;

  const result = { testName, expected, received, passed };
  console.log(`[Example Test] ${testName}: ${passed ? 'PASS' : 'FAIL'}`, result);
  return result;
};

console.log('Example test utility loaded successfully');

// ==================== DRY Helper Functions for Config Demos ====================
// Reusable utilities to reduce code duplication across similar demo patterns

window.DemoBuilder = {
  // Create a styled card container
  createCard(options = {}) {
    const card = document.createElement('div');
    card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';
    return card;
  },

  // Create description text block
  createDescription(html) {
    const div = document.createElement('div');
    div.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
    div.innerHTML = html;
    return div;
  },

  // Create code block with syntax highlighting
  createCodeBlock(code) {
    const pre = document.createElement('pre');
    pre.style.cssText = 'margin: 0; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 12px; color: var(--text-primary); overflow-x: auto; line-height: 1.5;';
    pre.innerHTML = `<code>${code}</code>`;
    return pre;
  },

  // Create feature list (checkmarks)
  createFeatureList(features) {
    const div = document.createElement('div');
    div.style.cssText = 'display: grid; gap: 8px; font-size: 13px;';
    div.innerHTML = features.map(f => `
      <div style="display: flex; gap: 8px; align-items: center;">
        <span style="color: #22c55e; font-weight: 600;">✓</span>
        <span>${f}</span>
      </div>
    `).join('');
    return div;
  },

  // Create key-value config section
  createConfigSection(items) {
    const div = document.createElement('div');
    div.style.cssText = 'display: grid; gap: 8px; font-size: 12px;';
    div.innerHTML = items.map(item => `
      <div style="display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
        <span style="font-weight: 600; color: var(--text-primary); min-width: 140px;">${item.label}</span>
        <span style="color: var(--text-muted);">${item.value}</span>
      </div>
    `).join('');
    return div;
  },

  // Initialize a config demo (reusable pattern)
  initConfigDemo(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.style.cssText = 'display: grid; gap: 16px;';

    const card = this.createCard();
    
    if (options.description) {
      card.appendChild(this.createDescription(options.description));
    }

    if (options.configItems) {
      card.appendChild(this.createConfigSection(options.configItems));
    }

    if (options.features) {
      if (options.code) {
        card.appendChild(this.createCodeBlock(options.code));
      }
      card.appendChild(this.createFeatureList(options.features));
    } else if (options.code) {
      card.appendChild(this.createCodeBlock(options.code));
    }

    container.appendChild(card);
    console.log(`${options.logName || 'Config'} demo initialized successfully`);
  },
};

console.log('DRY Demo Builder utilities loaded successfully');

// ==================== DEMO BUILDER MODULE ====================
App.register('DemoBuilder', {
  builder: window.DemoBuilder,
  
  init() {
    console.log('✓ DemoBuilder module initialized');
  }
});

(function initExampleTestDemo() {
  const container = document.getElementById('exampleTestDemoContainer');
  if (!container) return;

  container.style.cssText = 'display: grid; gap: 16px;';

  const card = document.createElement('div');
  card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
  desc.innerHTML = `
    <div>Runs a Vitest-style assertion: <code>expect(true).toBe(true)</code></div>
    <div>Logs the result to console and shows the status below.</div>
  `;
  card.appendChild(desc);

  const runBtn = document.createElement('button');
  runBtn.textContent = 'Run Example Test';
  runBtn.style.cssText = `
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.15s ease;
    justify-self: start;
  `;
  runBtn.onmouseover = () => {
    runBtn.style.background = 'var(--brand-color)';
    runBtn.style.color = '#fff';
    runBtn.style.borderColor = 'var(--brand-color)';
  };
  runBtn.onmouseout = () => {
    runBtn.style.background = 'var(--bg-secondary)';
    runBtn.style.color = 'var(--text-primary)';
    runBtn.style.borderColor = 'var(--border-color)';
  };

  const status = document.createElement('div');
  status.style.cssText = 'padding: 10px 12px; background: var(--bg-secondary); border-radius: 8px; border-left: 3px solid var(--border-color); font-size: 13px; color: var(--text-muted);';
  status.textContent = 'Result: not run yet';

  runBtn.onclick = () => {
    const result = window.runExampleTest();
    if (result.passed) {
      status.textContent = `PASS: ${result.testName}`;
      status.style.borderLeftColor = '#22c55e';
      status.style.color = '#16a34a';
      if (window.toast) {
        window.toast({
          title: 'Test Passed',
          description: result.testName,
          duration: 2000
        });
      }
    } else {
      status.textContent = `FAIL: ${result.testName}`;
      status.style.borderLeftColor = '#ef4444';
      status.style.color = '#b91c1c';
      if (window.toast) {
        window.toast({
          title: 'Test Failed',
          description: result.testName,
          duration: 2000
        });
      }
    }
  };

  card.appendChild(runBtn);
  card.appendChild(status);
  container.appendChild(card);

  console.log('Example test demo initialized successfully');
})();

  // ==================== Logo Spin Demo (Vite-style) ====================
  (function initLogoDemo() {
    const container = document.getElementById('logoDemoContainer');
    if (!container) return;

    const root = document.createElement('div');
    root.id = 'logoDemoRoot';

    const card = document.createElement('div');
    card.className = 'logo-demo-card';
    card.style.cssText = 'display: grid; gap: 12px;';

    const heading = document.createElement('div');
    heading.style.cssText = 'font-weight: 600; font-size: 15px; color: var(--text-primary);';
    heading.textContent = 'Hover or wait to see spin (prefers-reduced-motion respected)';
    card.appendChild(heading);

    const logosRow = document.createElement('div');
    logosRow.className = 'logo-demo-logos';

    const makeLogo = (label, isReact) => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display: grid; gap: 8px; align-items: center; justify-items: center;';

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 256 256');
      svg.classList.add('logo');
      svg.classList.add('spin');
      if (isReact) svg.classList.add('react');
      svg.innerHTML = `
        <defs>
          <linearGradient id="grad" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#8b5cf6" />
            <stop offset="100%" stop-color="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="128" cy="128" r="96" fill="url(#grad)" />
        <circle cx="128" cy="128" r="64" fill="var(--bg-secondary)" />
        <text x="128" y="140" text-anchor="middle" font-size="64" font-family="Arial" fill="var(--text-primary)">V</text>
      `;
      wrapper.appendChild(svg);

      const caption = document.createElement('div');
      caption.style.cssText = 'font-size: 13px; color: var(--text-muted);';
      caption.textContent = label;
      wrapper.appendChild(caption);

      return wrapper;
    };

    logosRow.appendChild(makeLogo('Base Logo', false));
    logosRow.appendChild(makeLogo('React Variant', true));

    card.appendChild(logosRow);

    const note = document.createElement('div');
    note.style.cssText = 'font-size: 12px; color: var(--text-muted);';
    note.textContent = 'Spin animation disabled when prefers-reduced-motion is set.';
    card.appendChild(note);

    root.appendChild(card);
    container.appendChild(root);

    console.log('Logo spin demo initialized successfully');
  })();

  // ==================== App Router Demo (Index + NotFound) ====================
  // Simulates BrowserRouter/Routes/Route with two routes: '/' and catch-all '*'
  (function initAppRouterDemo() {
    const container = document.getElementById('appRouterDemoContainer');
    if (!container) return;

    container.style.cssText = 'display: grid; gap: 16px;';

    const card = document.createElement('div');
    card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

    const desc = document.createElement('div');
    desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
    desc.innerHTML = `
      <div>Router demo that mirrors React setup:</div>
      <div>• '/' → Index view</div>
      <div>• '*' → NotFound view</div>
      <div>Uses History API and re-renders on navigation/popstate.</div>
    `;
    card.appendChild(desc);

    const controls = document.createElement('div');
    controls.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;';

    const routes = [
      { path: '/', label: 'Go to / (Index)' },
      { path: '/tickets', label: 'Go to /tickets' },
      { path: '/call-logs', label: 'Go to /call-logs' },
      { path: '/missing', label: 'Go to /missing (404)' },
    ];

    const view = document.createElement('div');
    view.style.cssText = 'padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; min-height: 160px; display: grid; align-content: center; gap: 8px;';

    const status = document.createElement('div');
    status.style.cssText = 'font-size: 13px; color: var(--text-muted);';
    status.textContent = 'Current route: /';

    // Renderer
    const renderRoute = (path) => {
      view.innerHTML = '';
      const pathDiv = document.createElement('div');
      pathDiv.style.cssText = 'font-weight: 600; color: var(--text-primary);';
      pathDiv.textContent = `Route: ${path}`;
      view.appendChild(pathDiv);

      if (path === '/') {
        const body = document.createElement('div');
        body.style.cssText = 'font-size: 13px; color: var(--text-muted);';
        body.textContent = 'Index view (home) rendered.';
        view.appendChild(body);
      } else if (path === '/tickets') {
        const body = document.createElement('div');
        body.style.cssText = 'font-size: 13px; color: var(--text-muted);';
        body.textContent = 'Tickets section placeholder.';
        view.appendChild(body);
      } else if (path === '/call-logs') {
        const body = document.createElement('div');
        body.style.cssText = 'font-size: 13px; color: var(--text-muted);';
        body.textContent = 'Call Logs section placeholder.';
        view.appendChild(body);
      } else {
        const notFound = window.createNotFoundPage({ pathname: path });
        view.appendChild(notFound.element);
      }

      status.textContent = `Current route: ${path}`;
    };

    const navigate = (path) => {
      window.history.pushState({ path }, '', path);
      renderRoute(path);
      if (window.toast) {
        window.toast({ title: 'Navigated', description: path, duration: 1600 });
      }
    };

    routes.forEach((r) => {
      const btn = document.createElement('button');
      btn.textContent = r.label;
      btn.style.cssText = `
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-primary);
        cursor: pointer;
        font-weight: 500;
        font-size: 13px;
        transition: all 0.15s ease;
      `;
      btn.onmouseover = () => {
        btn.style.background = 'var(--brand-color)';
        btn.style.color = '#fff';
        btn.style.borderColor = 'var(--brand-color)';
      };
      btn.onmouseout = () => {
        btn.style.background = 'var(--bg-secondary)';
        btn.style.color = 'var(--text-primary)';
        btn.style.borderColor = 'var(--border-color)';
      };
      btn.onclick = () => navigate(r.path);
      controls.appendChild(btn);
    });

    card.appendChild(controls);
    card.appendChild(status);
    card.appendChild(view);
    container.appendChild(card);

    // Handle back/forward
    window.addEventListener('popstate', (e) => {
      const path = e.state?.path || window.location.pathname;
      renderRoute(path);
    });

    // Initial render
    renderRoute(window.location.pathname);

    console.log('App router demo initialized successfully');
  })();

  // ==================== shadcn/ui Config Reference ====================
  (function initShadcnConfigDemo() {
    const container = document.getElementById('shadcnConfigDemoContainer');
    if (!container) return;

    container.style.cssText = 'display: grid; gap: 16px;';

    const card = document.createElement('div');
    card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

    const desc = document.createElement('div');
    desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
    desc.innerHTML = 'Current shadcn/ui generator settings (schema, Tailwind, aliases).';
    card.appendChild(desc);

    const pre = document.createElement('pre');
    pre.style.cssText = 'margin: 0; padding: 12px; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border-color); font-size: 12px; color: var(--text-primary); overflow-x: auto;';

    const code = document.createElement('code');
    code.textContent = JSON.stringify({
      $schema: 'https://ui.shadcn.com/schema.json',
      style: 'default',
      rsc: false,
      tsx: true,
      tailwind: {
        config: 'tailwind.config.ts',
        css: 'src/index.css',
        baseColor: 'slate',
        cssVariables: true,
        prefix: ''
      },
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui',
        lib: '@/lib',
        hooks: '@/hooks'
      }
    }, null, 2);
    pre.appendChild(code);
    card.appendChild(pre);

    container.appendChild(card);

    console.log('shadcn/ui config demo initialized successfully');
  })();

  // ==================== ESLint Config Reference (TS/React) ====================
  (function initEslintConfigDemo() {
    const container = document.getElementById('eslintConfigDemoContainer');
    if (!container) return;

    container.style.cssText = 'display: grid; gap: 16px;';

    const card = document.createElement('div');
    card.style.cssText = 'display: grid; gap: 12px; padding: 16px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);';

    const desc = document.createElement('div');
    desc.style.cssText = 'font-size: 13px; color: var(--text-muted); line-height: 1.6;';
    desc.innerHTML = 'ESLint config for TS/React with react-hooks, react-refresh, and typescript-eslint.';
    card.appendChild(desc);

    const pre = document.createElement('pre');
    pre.style.cssText = 'margin: 0; padding: 12px; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border-color); font-size: 12px; color: var(--text-primary); overflow-x: auto;';

    const code = document.createElement('code');
    code.textContent = `import js from "@eslint/js";
  import globals from "globals";
  import reactHooks from "eslint-plugin-react-hooks";
  import reactRefresh from "eslint-plugin-react-refresh";
  import tseslint from "typescript-eslint";

  export default tseslint.config(
    { ignores: ["dist"] },
    {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
      },
      plugins: {
        "react-hooks": reactHooks,
        "react-refresh": reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  );`;
    pre.appendChild(code);
    card.appendChild(pre);

    container.appendChild(card);

    console.log('ESLint config demo initialized successfully');
  })();
