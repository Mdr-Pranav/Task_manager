const Validators = {
    // Required field validation
    required(value, fieldName = 'This field') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return `${fieldName} is required`;
        }
        return null;
    },

    // Email validation
    email(value) {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Invalid email address';
    },

    // Min length validation
    minLength(value, min, fieldName = 'This field') {
        if (!value) return null;
        return value.length >= min ? null : `${fieldName} must be at least ${min} characters`;
    },

    // Max length validation
    maxLength(value, max, fieldName = 'This field') {
        if (!value) return null;
        return value.length <= max ? null : `${fieldName} must be no more than ${max} characters`;
    },

    // Date validation
    date(value, fieldName = 'This field') {
        if (!value) return null;
        const date = new Date(value);
        return date instanceof Date && !isNaN(date) ? null : `${fieldName} must be a valid date`;
    },

    // Future date validation
    futureDate(value, fieldName = 'This field') {
        if (!value) return null;
        const date = new Date(value);
        const now = new Date();
        return date > now ? null : `${fieldName} must be a future date`;
    },

    // URL validation
    url(value) {
        if (!value) return null;
        try {
            new URL(value);
            return null;
        } catch {
            return 'Invalid URL';
        }
    },

    // Color hex code validation
    hexColor(value) {
        if (!value) return null;
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return hexRegex.test(value) ? null : 'Invalid hex color code';
    },

    // Task validation
    validateTask(data) {
        const errors = {};

        // Title validation
        const titleError = this.required(data.title, 'Title');
        if (titleError) errors.title = titleError;

        // Due date validation
        if (data.dueDate) {
            const dateError = this.date(data.dueDate, 'Due date');
            if (dateError) errors.dueDate = dateError;
        }

        // Priority validation
        if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
            errors.priority = 'Invalid priority level';
        }

        // Status validation
        if (data.status && !['pending', 'in-progress', 'completed'].includes(data.status)) {
            errors.status = 'Invalid status';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    // Category validation
    validateCategory(data) {
        const errors = {};

        // Name validation
        const nameError = this.required(data.name, 'Name');
        if (nameError) errors.name = nameError;

        // Color validation
        if (data.color) {
            const colorError = this.hexColor(data.color);
            if (colorError) errors.color = colorError;
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    // Form validation helper
    validateForm(formElement, validationRules) {
        const formData = new FormData(formElement);
        const errors = {};

        for (const [field, rules] of Object.entries(validationRules)) {
            const value = formData.get(field);
            
            for (const rule of rules) {
                const error = this[rule.type](value, rule.min, rule.max, field);
                if (error) {
                    errors[field] = error;
                    break;
                }
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}; 