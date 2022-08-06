window.customElements.define('raw-svg',
    class extends HTMLElement {
        // things required by Custom Elements
        constructor() { super(); }
        connectedCallback() { this.setTextContent(); }
        attributeChangedCallback() { this.setTextContent(); }
        static get observedAttributes() { return ['src']; }

        // Our function to set the textContent based on attributes.
        setTextContent()
        {
            this.innerHTML = this.getAttribute('src');
        }
    }
);
