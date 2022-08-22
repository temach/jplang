

Fountain = function(element)
{
    this.limit = 7;
    this.particles = [];
    this.autoAddParticle = false;
    this.height = document.documentElement.clientHeight;
    this.sizes = [15, 20, 25, 35, 45];
    this.mouseX = 0;
    this.mouseY = 0;
    this.variants = ["日", "年", "中", "会", "人", "国", "出", "生", "東", "行"];
    this.addHandlers(element);
    this.loop(element);
};

Fountain.prototype.addHandlers = function(element)
{
    element.addEventListener("pointermove", e => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      },
      { passive: false }
    )

    element.addEventListener("pointerdown", e => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.autoAddParticle = true;
    })

    document.addEventListener("pointerup", () => {
      this.autoAddParticle = false;
    })
    document.addEventListener("pointercancel", () => {
      this.autoAddParticle = false;
    })
    document.addEventListener("pointerout", () => {
      this.autoAddParticle = false;
    })
}

Fountain.prototype.loop = function(element)
{
    if (this.autoAddParticle && this.particles.length < this.limit) {
      this.createParticle();
    }

    this.updateParticles();
    requestAnimationFrame(this.loop.bind(this, element));
}

Fountain.prototype.createParticle = function() {
  var _document4, _document4$bodyEl;

  const size = this.sizes[Math.floor(Math.random() * this.sizes.length)];
  const speedHorz = Math.random() * 7;
  const speedUp = Math.random() * 25;
  const spinVal = Math.random() * 360;
  // const spinSpeed = Math.random() * 25 * (Math.random() <= 0.5 ? -1 : 1);
  const spinSpeed = Math.random() * 20 * (Math.random() <= 0.5 ? -1 : 1);
  const top = this.mouseY - size;
  const left = this.mouseX - size;
  const direction = Math.random() <= 0.5 ? -1 : 1;
  const particle = document.createElement("span");
  particle.innerHTML = this.variants[Math.floor(Math.random() * this.variants.length)];
  particle.classList.add("particle");
  particle.setAttribute("style", `
  font-size: ${size}px;
  left: ${left}px;
  top: ${top}px;
  transform: rotate(${spinVal}deg);
`);
  (_document4 = document) === null || _document4 === void 0 ? void 0 : (_document4$bodyEl = _document4.body) === null || _document4$bodyEl === void 0 ? void 0 : _document4$bodyEl.appendChild(particle);
  this.particles.push({
    direction,
    element: particle,
    left,
    size,
    speedHorz,
    speedUp,
    spinSpeed,
    spinVal,
    top
  });
}

Fountain.prototype.updateParticles = function() {
  this.particles.forEach(p => {
    p.left = p.left - p.speedHorz * p.direction;
    p.top = p.top - p.speedUp;
    p.speedUp = Math.min(p.size, p.speedUp - 1);
    p.spinVal = p.spinVal + p.spinSpeed;

    if (p.top > this.height - p.size) {
      this.particles = this.particles.filter(o => o !== p);
      p.element.remove();
    }

    p.element.setAttribute("style", `
    font-size: ${p.size}px;
    left: ${p.left}px;
    top: ${p.top}px;
    transform: rotate(${p.spinVal}deg);
  `);
  });
}



const f = new Fountain(document.getElementById("fountain"));
