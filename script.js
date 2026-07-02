// Selección de elementos del DOM
const rentalForm = document.getElementById('rental-form');
const vehicleInput = document.getElementById('vehicle-input');
const daysInput = document.getElementById('days-input');
const priceInput = document.getElementById('price-input');
const rentalList = document.getElementById('rental-list');
const loadingText = document.getElementById('loading');
const sortSelect = document.getElementById('sort-select');

// Estado de la aplicación cargado desde LocalStorage
let rentals = JSON.parse(localStorage.getItem('rentals')) || [];

// Al arrancar la aplicación, pintamos los elementos guardados
document.addEventListener('DOMContentLoaded', renderRentals);

// Evento de envío del formulario
rentalForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const vehicle = vehicleInput.value.trim();
    const days = parseInt(daysInput.value);
    const pricePerDay = parseFloat(priceInput.value);

    if (vehicle && days > 0 && pricePerDay > 0) {
        const totalUSD = days * pricePerDay;
        
        loadingText.classList.remove('hidden');

        try {
            // Llamada a la API pública de tipos de cambio
            const response = await fetch('https://er-api.com');
            if (!response.ok) throw new Error('Error de API');
            const data = await response.json();
            
            const eurRate = data.rates.EUR;
            const mxnRate = data.rates.MXN;

            // Estructura del nuevo objeto de alquiler
            const newRental = {
                id: Date.now(), // ID único para identificarlo
                vehicle: vehicle.toUpperCase(),
                days: days,
                usd: totalUSD,
                eur: (totalUSD * eurRate).toFixed(2),
                mxn: (totalUSD * mxnRate).toFixed(2),
                completed: false
            };

            // Añadir al estado y guardar en LocalStorage
            rentals.push(newRental);
            saveToLocalStorage();
            renderRentals();

        } catch (error) {
            console.error("Error cargando API, aplicando fallback", error);
            // Fallback si falla la red
            const newRental = {
                id: Date.now(),
                vehicle: vehicle.toUpperCase(),
                days: days,
                usd: totalUSD,
                eur: (totalUSD * 0.92).toFixed(2),
                mxn: (totalUSD * 17.50).toFixed(2),
                completed: false
            };
            rentals.push(newRental);
            saveToLocalStorage();
            renderRentals();
        } finally {
            loadingText.classList.add('hidden');
            rentalForm.reset();
            vehicleInput.focus();
        }
    }
});

// Guardar array actual en LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('rentals', JSON.stringify(rentals));
}

// Alternar el estado completado
function toggleComplete(id) {
    rentals = rentals.map(item => {
        if (item.id === id) {
            return { ...item, completed: !item.completed };
        }
        return item;
    });
    saveToLocalStorage();
    renderRentals();
}

// Eliminar un registro
function deleteRental(id) {
    rentals = rentals.filter(item => item.id !== id);
    saveToLocalStorage();
    renderRentals();
}

// Escuchar cambios en el selector de ordenamiento
sortSelect.addEventListener('change', renderRentals);

// Función principal para renderizar la lista dinámicamente
function renderRentals() {
    // Limpiamos la lista visual antes de repintar
    rentalList.innerHTML = '';

    // Clonamos el array para no mutar el original al ordenar
    let sortedRentals = [...rentals];

    // Aplicar ordenamiento según la selección del filtro
    const sortValue = sortSelect.value;
    if (sortValue === 'price-asc') {
        sortedRentals.sort((a, b) => a.usd - b.usd);
    } else if (sortValue === 'price-desc') {
        sortedRentals.sort((a, b) => b.usd - a.usd);
    }

    // Crear elementos en el DOM mediante bucle
    sortedRentals.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('rental-item');
        if (item.completed) li.classList.add('completed');

        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('rental-details');

        const title = document.createElement('div');
        title.classList.add('vehicle-title');
        title.textContent = `${item.vehicle} (${item.days} días)`;

        const breakdown = document.createElement('div');
        breakdown.classList.add('price-breakdown');
        breakdown.innerHTML = `
            Total: <strong>$${item.usd.toFixed(2)} USD</strong><br>
            Equivale a: €${item.eur} EUR / $${item.mxn} MXN
        `;

        detailsDiv.appendChild(title);
        detailsDiv.appendChild(breakdown);

        // Evento para completar utilizando el ID único
        detailsDiv.addEventListener('click', () => toggleComplete(item.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.classList.add('delete-btn');
        
        // Evento para eliminar utilizando el ID único
        deleteBtn.addEventListener('click', () => deleteRental(item.id));

        li.appendChild(detailsDiv);
        li.appendChild(deleteBtn);
        rentalList.appendChild(li);
    });
}
    // Añadir el nuevo alquiler a la lista en pantalla
    rentalList.appendChild(li);
}