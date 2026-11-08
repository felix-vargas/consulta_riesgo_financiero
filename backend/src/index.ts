import { app } from './app.js';
import { getSettings } from './config/settings.js';

const settings = getSettings();

app.listen(settings.port, () => {
    console.log(
        `[Backend] Consulta Riesgo Financiero API escuchando en http://localhost:${settings.port}`
    );
});
