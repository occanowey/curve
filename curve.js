const canvas = document.getElementById('curve');
const ctx = canvas.getContext('2d');

const state = {
    t: 1,
    handles: [
        handle(50, 50, false),
        // handle( 50, 450 ),
        // handle( 450, 50 ),
        handle(450, 450, false),
        handle(490, 490),
    ],

    animating: false,
    prevTime: 0,
    mouse: {
        x: 0,
        y: 0,
        down: false,
        wasDown: false,
        target: -1,
    },
    alt: false,

    options: {
        edit: true,
        debug: false,
        animate: false,
        t: 1,
        min_t: 0,
        max_t: 1,
        speed: 0.4,
    },

    handle_size: 10,
    add_size: 7,
}

function bindEvents() {
    canvas.onmousemove = ev => {
        state.mouse.x = ev.offsetX;
        state.mouse.y = ev.offsetY;
    }

    canvas.onmousedown = () => state.mouse.down = true;
    canvas.onmouseup = () => state.mouse.down = false;

    document.onkeydown = ev => {
        if (ev.key == 'Alt') {
            state.alt = true;
        }
    }

    document.onkeyup = ev => {
        if (ev.key == 'Alt') {
            state.alt = false;

            ev.preventDefault();
        }
    }

    document.getElementById('edit').oninput = ev => state.options.edit = ev.target.checked;
    document.getElementById('debug').oninput = ev => state.options.debug = ev.target.checked;
    document.getElementById('animate').oninput = ev => state.options.animate = ev.target.checked;
    document.getElementById('t').oninput = ev => state.options.t = parseFloat(ev.target.value);
    document.getElementById('min_t').oninput = ev => state.options.min_t = parseFloat(ev.target.value);
    document.getElementById('max_t').oninput = ev => state.options.max_t = parseFloat(ev.target.value);
    document.getElementById('speed').oninput = ev => state.options.speed = parseFloat(ev.target.value);
}

function distanceSquare(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}

function random(min, max) {
    return Math.round(Math.random() * (max - min)) + min;
}

function handle(x, y, static = false) {
    return { x, y, static }
}

function clear() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 500, 500);
}

function getPointInRange(t, start, end) {
    let xStart = start[0];
    let yStart = start[1];

    let xRange = end[0] - xStart;
    let yRange = end[1] - yStart;

    return [
        xStart + xRange * t,
        yStart + yRange * t
    ];
}

function drawCurveInternal(t, points) {
    if (points.length > 2) {
        const intermediaryPoints = [];
        let prev = points[0];
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            intermediaryPoints.push(getPointInRange(t, prev, point));

            prev = point;
        }

        drawCurveInternal(t, intermediaryPoints);
    } else {
        ctx.lineTo(...getPointInRange(t, points[0], points[1]));
    }
}

function drawCurve(step, ...points) {
    drawCurvePartial(step, 1, ...points);
}

function drawCurvePartial(step, end, ...points) {
    if (points.length < 2) {
        throw Error('Invalid number of points, must be 2 or greater.');
    }

    ctx.beginPath();

    let i = 0;
    while (i < end) {
        drawCurveInternal(i, points);

        i += step;
    }

    ctx.stroke();
}

function debugCurve(t, points, allPoints, depth = 0) {
    const maxDepth = points.length - 1;
    const hueStep = 280 / maxDepth;
    const hue = 40 + depth * hueStep;

    if (depth === 0) {
        allPoints = points;

        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1.75;
    } else {
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 1.25;
    }

    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let point of points) {
        ctx.lineTo(...point);
    }
    ctx.stroke();

    for (let point of points) {
        ctx.beginPath();
        ctx.arc(point[0], point[1], 3, 0, 360);

        if (depth === 0) {
            ctx.stroke();
        } else {
            ctx.fill();
        }
    }



    if (points.length > 2) {
        const intermediaryPoints = [];
        let prev = points[0];
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            intermediaryPoints.push(getPointInRange(t, prev, point));

            prev = point;
        }

        debugCurve(t, intermediaryPoints, allPoints, depth + 1);
    } else {
        let [pointX, pointY] = getPointInRange(t, points[0], points[1]);

        ctx.beginPath();
        ctx.moveTo(...points[0]);
        ctx.lineTo(...points[1]);
        ctx.stroke();

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1.25;
        drawCurvePartial(0.001, t, ...allPoints);

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(pointX, pointY, 4, 0, 360);
        ctx.fill();
    }
}

{
    function min_dist_from_handles(handle) {
        let min_dist;

        for (let other of state.handles) {
            let dist = distanceSquare(handle, other);
            if (typeof min_dist == 'undefined' || dist < min_dist) {
                min_dist = dist;
            }
        }

        return min_dist;
    }

    function random_handle(min_dist) {
        let min_dist_sq = min_dist ** 2;
        let h = handle(random(0, 490), random(0, 490));

        while (min_dist_from_handles(h) < min_dist_sq) {
            h = handle(random(0, 490), random(0, 490));
        }

        return h;
    }

    function random_handles() {
        state.handles.splice(0, state.handles.length - 1);

        for (let i = 0; i < random(4, 10); i++) {
            state.handles.push(random_handle(140))
        }
    }
}

{
    function drawHandle({ x, y, static, hover }, size) {
        if (hover) {
            ctx.strokeStyle = 'rgba(50, 150, 70, 0.5)';
        } else {
            ctx.strokeStyle = 'rgba(50, 50, 50, 0.5)';
        }

        ctx.lineWidth = 2.25;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 360);

        if (static) {
            // cross offset
            let co = size / 2;

            ctx.moveTo(x - co, y - co);
            ctx.lineTo(x + co, y + co);
            ctx.moveTo(x + co, y - co);
            ctx.lineTo(x - co, y + co);
        }

        ctx.stroke();
    }

    function drawAddRemove(x, y, size, add) {
        if (add) {
            ctx.strokeStyle = 'rgba(50, 150, 70, 0.5)';
        } else {
            ctx.strokeStyle = 'rgba(150, 50, 50, 0.5)';
        }


        ctx.lineWidth = 1.75;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 360);

        ctx.moveTo(x + 4, y);
        ctx.lineTo(x - 4, y);

        if (add) {
            ctx.moveTo(x, y + 4);
            ctx.lineTo(x, y - 4);
        }

        ctx.stroke();
    }

    function updateHandles() {

        document.body.style.cursor = 'unset'; // grab
        // grabbing

        if (state.options.edit) {
            for (let i = 1; i < state.handles.length; i++) {
                let prev = state.handles[i - 1];
                let curr = state.handles[i];

                const [x, y] = getPointInRange(0.5, [prev.x, prev.y], [curr.x, curr.y]);
                const hover = distanceSquare(state.mouse, { x, y }) < Math.pow( state.add_size / 2, 2 ) * 2;

                if (hover) {
                    document.body.style.cursor = 'pointer';
                }

                if (hover && state.mouse.down && !state.mouse.wasDown) {
                    if (state.alt) {
                        state.handles.splice(i, 1);
                    } else {
                        state.handles.splice(i, 0, handle(x, y));
                    }
                }

                drawAddRemove(x, y, state.add_size, !state.alt);
            }
        }

        for (const handle of state.handles) {
            if (!handle.static) {
                handle.hover = distanceSquare(state.mouse, handle) < 100;
            }


            if (handle.hover && state.mouse.down && !state.mouse.wasDown) {
                handle.selected = true;
                handle.offset = {
                    x: handle.x - state.mouse.x,
                    y: handle.y - state.mouse.y,
                };
            }

            if (handle.selected) {
                if (state.mouse.down) {
                    handle.x = Math.floor((state.mouse.x / 10) + .5) * 10;
                    handle.y = Math.floor((state.mouse.y / 10) + .5) * 10;
                } else {
                    handle.selected = false;
                }
            }

            if (state.options.edit) {
                drawHandle(handle, state.handle_size);
            }
        }

        state.mouse.wasDown = state.mouse.down;
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba( 0, 0, 0, 0.1 )';
    ctx.beginPath()
    for (let x = 10; x < 500; x += 10) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 500);

        ctx.moveTo(0, x);
        ctx.lineTo(500, x);
    }
    ctx.stroke();
}

function mainLoop(time) {
    let timeDelta = time - state.prevTime;
    let updateStep = timeDelta / 1000;

    clear();
    drawGrid();

    updateHandles();
    const points = state.handles.map(({ x, y }) => [x, y]);

    // start animation
    if (state.options.animate && !state.animating) {
        state.animating = true;
        state.t = 0
    }

    // end animation
    if (!state.options.animate && state.animating) {
        state.animating = false;
        state.t = 1;
    }

    // update t depending on options
    if (state.options.animate) {
        state.t = (state.t + state.options.speed * updateStep) % 1;
    } else {
        state.t = state.options.t;
    }

    // map t to min/max range
    let range_t = state.options.min_t + (state.t * (state.options.max_t - state.options.min_t))

    // draw curve
    if (state.options.debug) {
        debugCurve(range_t, points);
    } else {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.25;
        drawCurvePartial(0.001, range_t, ...points);
    }

    state.prevTime = time;
    requestAnimationFrame(mainLoop);
}

bindEvents();
requestAnimationFrame(mainLoop);




function encodePoints(points) {
    // Layout for point in 32bit int
    // x0000000000000000000000000000000
    //  ^^-------------^^-------------^
    //  || - x          | - y
    //  | - static

    // convert point data to 32bit ints
    let pointData = points.map(p => (p.static << 30) | (p.x & 0x7fff) << 15 | (p.y & 0x7fff));

    // split 32bit ints into bytes
    let bytes = new Uint8Array(new Uint32Array(pointData).buffer);

    // encode byte array into base64
    return btoa(String.fromCharCode.apply(null, bytes));
}

function decodePoints(encoded) {
    // decode base64 into byte array
    let bytes = new Uint8Array(atob(encoded).split('').map(c => c.charCodeAt(0)));

    // join bytes into 32bit ints
    let pointData = new Uint32Array(bytes.buffer);

    // decode and return points
    return Array.from(pointData)
        .map(point => ({
            static: (point >> 30) > 0,
            x: (point >> 15) & 0x7fff,
            y: point & 0x7fff,
        }));
}

// jank
if (window.location.hash) {
    state.handles = decodePoints(window.location.hash.substr(1));
}

// "zig zag" vertical
// CgAFQCgABQBGAAUAZAAFAIIABQCgAAUAvgAFANwABQD6AAUAGAEFADYBBQBUAQUAcgEFAJABBQCuAQUAzAEFAOoBBQDMARQArgEjAJABMgByAUEAVAFQADYBXwAYAW4A+gB9ANwAjAC+AJsAoACqAIIAuQBkAMgARgDXACgA5gAKAPUAKAD1AEYA9QBkAPUAggD1AKAA9QC+APUA3AD1APoA9QAYAfUANgH1AFQB9QByAfUAkAH1AK4B9QDMAfUA6gH1AA==

// "zig zag" diagonal
// CgD1AAoA5gAoAPUARgD1AAoA1wAKAMgAZAD1AIIA9QAKALkACgCqAKAA9QC+APUACgCbAAoAjADcAPUA+gD1AAoAfQAKAG4AGAH1ADYB9QAKAF8ACgBQAFQB9QByAfUACgBBAAoAMgCQAfUArgH1AAoAIwAKABQAzAH1AOoB9QAKAAUAKAAFAOoB5gDqAdcARgAFAGQABQDqAcgA6gG5AIIABQCgAAUA6gGqAOoBmwC+AAUA3AAFAOoBjADqAX0A+gAFABgBBQDqAW4A6gFfADYBBQBUAQUA6gFQAOoBQQByAQUAkAEFAOoBMgDqASMArgEFAMwBBQDqARQA6gEFAA==

// spinny
// +gB9ABgBfQAYAYwA3ACMANwAaQA2AWkANgGbAL4AmwC+AFoAVAFaAFQBqgCgAKoAoABLAHIBSwByAbkAggC5AIIAPACQATwAkAHIAGQAyABkAC0ArgEtAK4B1wBGANcARgAeAMwBHgDMAeYAKADmACgADwDqAQ8A6gH1AAoA9QAKAAUA

// spinny lots of points
// +gB9ABgBfQAYAYwA+gCMANwAjADcAH0A3ABuAPoAbgAYAW4ANgFuADYBfQA2AYwANgGbABgBmwD6AJsA3ACbAL4AmwC+AIwAvgB9AL4AbgC+AF8A3ABfAPoAXwAYAV8ANgFfAFQBXwBUAW4AVAF9AFQBjABUAZsAVAGqADYBqgAYAaoA+gCqANwAqgC+AKoAoACqAKAAmwCgAIwAoAB9AKAAbgCgAF8AoABQAL4AUADcAFAA+gBQABgBUAA2AVAAVAFQAHIBUAByAV8AcgFuAHIBfQByAYwAcgGbAHIBqgByAbkAVAG5ADYBuQAYAbkA+gC5ANwAuQC+ALkAoAC5AIIAuQCCAKoAggCbAIIAjACCAH0AggBuAIIAXwCCAFAAggBBAKAAQQC+AEEA3ABBAPoAQQAYAUEANgFBAFQBQQByAUEAkAFBAJABUACQAV8AkAFuAJABfQCQAYwAkAGbAJABqgCQAbkAkAHIAHIByABUAcgANgHIABgByAD6AMgA3ADIAL4AyACgAMgAggDIAGQAyABkALkAZACqAGQAmwBkAIwAZAB9AGQAbgBkAF8AZABQAGQAQQBkADIAggAyAKAAMgC+ADIA3AAyAPoAMgAYATIANgEyAFQBMgByATIAkAEyAK4BMgCuAUEArgFQAK4BXwCuAW4ArgF9AK4BjACuAZsArgGqAK4BuQCuAcgArgHXAJAB1wByAdcAVAHXADYB1wAYAdcA+gDXANwA1wC+ANcAoADXAIIA1wBkANcARgDXAEYAyABGALkARgCqAEYAmwBGAIwARgB9AEYAbgBGAF8ARgBQAEYAQQBGADIARgAjAGQAIwCCACMAoAAjAL4AIwDcACMA+gAjABgBIwA2ASMAVAEjAHIBIwCQASMArgEjAMwBIwDMATIAzAFBAMwBUADMAV8AzAFuAMwBfQDMAYwAzAGbAMwBqgDMAbkAzAHIAMwB1wDMAeYArgHmAJAB5gByAeYAVAHmADYB5gAYAeYA+gDmANwA5gC+AOYAoADmAIIA5gBkAOYARgDmACgA5gAoANcAKADIACgAuQAoAKoAKACbACgAjAAoAH0AKABuACgAXwAoAFAAKABBACgAMgAoACMAKAAUAEYAFABkABQAggAUAKAAFAC+ABQA3AAUAPoAFAAYARQANgEUAFQBFAByARQAkAEUAK4BFADMARQA6gEUAOoBIwDqATIA6gFBAOoBUADqAV8A6gFuAOoBfQDqAYwA6gGbAOoBqgDqAbkA6gHIAOoB1wDqAeYA6gH1AMwB9QCuAfUAkAH1AHIB9QBUAfUANgH1ABgB9QD6APUA3AD1AL4A9QCgAPUAggD1AGQA9QBGAPUAKAD1AAoA9QAKAOYACgDXAAoAyAAKALkACgCqAAoAmwAKAIwACgB9AAoAbgAKAF8ACgBQAAoAQQAKADIACgAjAAoAFAAKAAUAKAAFAEYABQBkAAUAggAFAKAABQC+AAUA3AAFAPoABQAYAQUANgEFAFQBBQByAQUAkAEFAK4BBQDMAQUA6gEFAA==
