const Modal = {
    modal: null,
    modalContent: null,
    isOpen: false,

    init() {
        this.modal = document.getElementById('modal');
        this.modalContent = document.getElementById('modal-content');
        
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    open(content) {
        this.modalContent.innerHTML = '';
        
        if (typeof content === 'string') {
            this.modalContent.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            this.modalContent.appendChild(content);
        }

        this.modal.classList.remove('hidden');
        this.isOpen = true;

        // Add animation classes
        this.modal.classList.add('fade-in');
        this.modalContent.parentElement.classList.add('slide-in');
    },

    close() {
        this.modal.classList.add('hidden');
        this.isOpen = false;
        this.modalContent.innerHTML = '';
    },

    confirm(message, onConfirm, onCancel) {
        const content = Helpers.dom.create('div', { className: 'text-center' }, [
            Helpers.dom.create('p', { className: 'mb-4 text-lg' }, [message]),
            Helpers.dom.create('div', { className: 'flex justify-center space-x-4' }, [
                Helpers.dom.create('button', {
                    className: 'btn btn-danger',
                    onclick: () => {
                        onConfirm();
                        this.close();
                    }
                }, ['Confirm']),
                Helpers.dom.create('button', {
                    className: 'btn btn-secondary',
                    onclick: () => {
                        if (onCancel) onCancel();
                        this.close();
                    }
                }, ['Cancel'])
            ])
        ]);

        this.open(content);
    },

    alert(message, type = 'info') {
        const content = Helpers.dom.create('div', { className: 'text-center' }, [
            Helpers.dom.create('p', { 
                className: `mb-4 text-lg ${type === 'error' ? 'text-red-600' : 'text-gray-700'}`
            }, [message]),
            Helpers.dom.create('button', {
                className: 'btn btn-primary',
                onclick: () => this.close()
            }, ['OK'])
        ]);

        this.open(content);
    },

    form(config) {
        const form = Helpers.dom.create('form', {
            className: 'space-y-4',
            onsubmit: (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                config.onSubmit(data);
            }
        });

        // Add title if provided
        if (config.title) {
            form.appendChild(
                Helpers.dom.create('h2', {
                    className: 'text-xl font-bold mb-4'
                }, [config.title])
            );
        }

        // Add fields
        config.fields.forEach(field => {
            const fieldContainer = Helpers.dom.create('div', { className: 'space-y-1' });
            
            // Label
            fieldContainer.appendChild(
                Helpers.dom.create('label', {
                    className: 'form-label',
                    for: field.name
                }, [field.label])
            );

            // Input
            const input = Helpers.dom.create(field.type === 'textarea' ? 'textarea' : 'input', {
                className: 'form-input',
                id: field.name,
                name: field.name,
                type: field.type || 'text',
                value: field.value || '',
                ...(field.attributes || {})
            });

            if (field.type === 'select' && field.options) {
                field.options.forEach(option => {
                    input.appendChild(
                        Helpers.dom.create('option', {
                            value: option.value
                        }, [option.label])
                    );
                });
            }

            fieldContainer.appendChild(input);

            form.appendChild(fieldContainer);
        });

        // Add buttons
        const buttons = Helpers.dom.create('div', {
            className: 'flex justify-end space-x-2 mt-6'
        }, [
            Helpers.dom.create('button', {
                type: 'button',
                className: 'btn btn-secondary',
                onclick: () => this.close()
            }, ['Cancel']),
            Helpers.dom.create('button', {
                type: 'submit',
                className: 'btn btn-primary'
            }, [config.submitText || 'Submit'])
        ]);

        form.appendChild(buttons);

        this.open(form);
    }
}; 