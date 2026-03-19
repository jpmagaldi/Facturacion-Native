# FacturadorLaPrimera-ReactNative

(This product was designed for a Spanish-speaking company)

Initial project for issuing online invoices via mobile device, connected via Bluetooth to a (non-fiscal) printer to generate physical receipts.

The initial idea is to use the same database currently used by the company. Therefore, a file called Servidor.py is provided, which acts as a "server" to handle requests for generating invoices using PyAfipWs.

You just need to modify some company-specific details in the Servidor.py file and then run it with Python.

### Features:
- Already connects to ARCA to request the latest issued invoice (for security reasons, the .crt and .key files that go in the "Certificados" folder of the app have been removed)

- Searches for Bluetooth devices that the mobile phone already recognizes to enable pairing

- Invoices generate CAE and include QR codes (according to regulations from the Argentinian authority)

- Customer and product searches with their prices in the database, configured from the Server.py file. These can also be downloaded to the endpoint to save on data transfer.

- Invoice non-fiscal is enabled

- Selected data within the app is dynamically stored in the device's memory or server's data

- Can also reprint previously generated invoices

- One-click price and client synchronization

- Alerts and errors when there is no connection

- Daily invoice sorting, with total amount and number of invoices

- Stock management

### Images (Reminder: everything is still in progress):

<p align="left">
![](https://imgur.com/Nj9Z2V0.png)

![](https://imgur.com/zt1FlRU.png)

![](https://imgur.com/WtDIBaz.png)
</p>
All images available at: https://imgur.com/a/Gjoq6dO


## License
[MIT](https://choosealicense.com/licenses/mit/)
