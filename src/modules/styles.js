// Styles Module - CSS will be injected during build

function addStyles() {
    // CSS content will be injected here during build
    const css = '/* This will be replaced by build script */';

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}
