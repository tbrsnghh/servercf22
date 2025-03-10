const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3002;

const DB_FILE = path.join(__dirname, 'db.json');
app.use(express.json());
app.use(cors()); // Thêm CORS

// Serve frontend từ thư mục dist
app.use(express.static(path.join(__dirname, 'dist')));

// Chuyển hướng tất cả request khác về index.html (cho React Router hoạt động)
app.get('/orderslist', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Đọc dữ liệu từ db.json
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) return { orders: [] };
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};

// Ghi dữ liệu vào db.json
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// API lấy danh sách đơn hàng
app.get('/orders', (req, res) => {
    const data = readDB();
    res.json(data.orders);
});

// API tạo đơn hàng mới
app.post('/orders', (req, res) => {
    const data = readDB();
    const order_id = data.orders.length > 0 ? data.orders[data.orders.length - 1].id + 1 : 1;
    if (req.customerName == ''){
        req.customerName = 'Khách lạ';
    }
    const newOrder = {...req.body, id: order_id};
    
    data.orders.push(newOrder);
    writeDB(data);
    res.status(201).json(newOrder);
});

// API cập nhật trạng thái đơn hàng
app.put('/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['new', 'processing', 'done', 'cancelled'];
    const orderStatuses = ['new', 'processing', 'done'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const data = readDB();
    const order = data.orders.find(order => order.id == id);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'done') {
        return res.status(400).json({ error: 'Cannot modify a completed order' });
    }

    // Cho phép hủy đơn từ bất kỳ trạng thái nào trừ "done"
    if (status === 'cancelled') {
        order.status = 'cancelled';
    } else {
        const currentIndex = orderStatuses.indexOf(order.status);
        const newIndex = orderStatuses.indexOf(status);
        
        if (newIndex === -1 || newIndex < currentIndex) {
            return res.status(400).json({ error: 'Invalid status transition' });
        }
        
        order.status = status;
    }

    writeDB(data);
    res.json(order);
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });
