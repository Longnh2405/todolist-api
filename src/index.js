const { response } = require("express");
var express = require("express");
var app = express();

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.listen(3000, function () {
  console.log("hihi");
});
var mysql = require("mysql");

// SSH
// 192.168.9.12
// root
// 8GzEhNYz88ytt2LG

var db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "todolist",
});
db.connect(function (err) {
  if (err) throw err;
  console.log("Connected!!!");
});

//==================================
/**
 * Thêm data vào cho bảng user_task
 * check dữ liệu xem đúng form hay chưa
 * nếu rồi thì cho phép
 */
app.get("/api/user-select", (req, res) => {
  let sql = `SELECT * FROM user `;
  db.query(sql, (err, data) => {
    res.send(data);
  });
});
app.post("/api/user_add", (req, res) => {
  const name = req.body.name;
  if (name && typeof name == "string") {
    let sql = `INSERT INTO user(name) VALUES ('${name}')`;
    db.query(sql, (err, data) => {
      if (err) throw err;
      res.send("thanh cong");
    });
  } else {
    res.send("Bao loi");
  }
});
app.post("/api/user-update/user/:id", (req, res) => {
  const user_id = req.params.id;
  const name = req.body.name;
  if (user_id) {
    if (name && typeof name == "string") {
      let sql = `UPDATE user SET name='${name}' WHERE id= ${user_id}`;
      db.query(sql, (err, data) => {
        if (err) throw err;
        res.send("Sửa thành công");
      });
    } else {
      res.send("Nhập lại name");
    }
  } else {
    res.send("Nhập vào id");
  }
});
app.delete("/api/user-delete/user/:id", (req, res) => {
  const user_id = req.params.id;
  if (user_id) {
    let sql_check = `SELECT * FROM user WHERE id = ${user_id}`;
    let sql = `DELETE FROM user WHERE id = ${user_id}`;
    db.query(sql_check, (err, data) => {
      if (err) throw err;
      if (data.length >= 1) {
        db.query(sql, (err, data) => {
          if (err) throw err;
          res.send("Xoá thành công");
        });
      } else {
        res.send("Không có dữ liệu");
      }
    });
  } else {
    res.send("Nhập lại id");
  }
});

// const check2 = function (req, res, next) {
//   req.check2 = Date.now();
//   next();
// };

// app.use(requestTime);

// app.get("/request-time", (req, res) => {
//   let responseText = "Hello World!<br>";
//   responseText += `<small>Requested at: ${req.requestTime}</small>`;
//   res.send(responseText);
// });
// tính tổng các task mà user được giao
app.get("/api/user-task-select/user-sum-task/:id", (req, res) => {
  const user_id = req.params.id;
  if (user_id) {
    let sql_check = `SELECT * FROM user WHERE id = ${user_id}`;
    db.query(sql_check, (err, data) => {
      if (err) throw err;
      if (data.length < 1) {
        res.send("Không có dữ liệu người dùng");
      } else {
        let sql = `SELECT user.* ,COUNT( DISTINCT user_task.task_id) as so_luong_task FROM user
        INNER JOIN user_task ON user.id = user_task.user_id
        LEFT JOIN task ON user_task.task_id = task.id
        WHERE user.id =${user_id}`;
        db.query(sql, (err, data) => {
          if (err) throw err;
          res.send(data);
        });
      }
    });
  }
});
// tính tổng các task mà user không được giao
// đưa vào user_id, lấy ra dữ liệu
// đưa ra thông tin user, số lượng task mà user không được giao
// tìm số lượng task mà user không được giao:
// join 2 bảng user_task và task để lấy ra id tất cả các task
// lấy ra các task trong mà không được gán user_id là user_id truyền vào
// và các task không được truyền vào bảng user_task
// thì trả ra số lượng đã distinct
app.get("/api/user-task-select/user-sum-no-task/:id", (req, res) => {
  const user_id = req.params.id;
  if (user_id) {
    let sql_check = `SELECT * FROM user WHERE id = ${user_id}`;
    db.query(sql_check, (err, data) => {
      if (err) throw err;
      if (data.length < 1) {
        res.send("Không có dữ liệu người dùng");
      } else {
        let sql = `SELECT COUNT(DISTINCT task.id ) as count_id, ,user.id as user_id user.name as user_name FROM task
        LEFT JOIN user_task ON task.id = user_task.task_id
        LEFT JOIN user ON user_task.user_id = user.id
        WHERE user.id = ${user_id} OR user.id is null `;
        db.query(sql, (err, data) => {
          if (err) throw err;
          res.send(data);
        });
      }
    });
  }
});

// tính tổng các task mà không được giao cho user nào
// lấy ra các task không tồn tại trong user task
// dùng count đếm các giá trị trả về
app.get("/api/user-task-select/task-sum-no-user", (req, res) => {
  sql = `SELECT COUNT(task.id) as task_no_user FROM task
  LEFT JOIN user_task ON task.id = user_task.task_id
  WHERE user_task.task_id IS null`;
  db.query(sql, (err, data) => {
    if (err) throw err;
    res.send(data);
  });
});
// tính tổng số task được đã được giao cho các user
// lấy ra các task tồn tại trong user_task
// dùng count đếm giá trị trả về
app.get("/api/user-task-select/task-sum-user", (req, res) => {
  sql = `SELECT COUNT(DISTINCT task.id) as sum_task_user FROM task
  INNER JOIN user_task ON task.id = user_task.task_id`;
  db.query(sql, (err, data) => {
    if (err) throw err;
    res.send(data);
  });
});
//==============================
/**
 * lẩy ra id, kiểm tra xem id có tồn tại trong cơ sở dữ liệu hay khôg
 * nếu không thì báo lỗi
 * nếu có thì lấy ra thông tin user.name
 * chỉ user nào có task thì mới tồn tại id trong bảng user_task
 * lấy ra list_status, lấy được 1 mảng chứa status object
 * lấy ra user.user_id, user.user_name, task.status
 * so sánh task.status với status.id
 * nếu mà bằng nhau thì tạo ra mảng mới lưu các object gồm {user.user_id, user.user_name, status.name}
 *
 */

// })

// đưa ra thông tin của user, nếu không có task thì chỉ đưa về thông tin của user

// app.get("/user_task_select/:user_id", (req, res) => {
//   let rt_data = [];
//   const user_id = req.params.user_id;
//   if (user_id) {
//     const sql_check = `SELECT * FROM user WHERE id = ${user_id}`;
//     db.query(sql_check, (err, data_user) => {
//       if (err) throw err;
//       // console.log(data_user[0].id);
//       if (data_user.length < 1) {
//         return res.send("Không có trong cơ sở dữ liệu");
//       } else {
//         // const sql_check = `SELECT * FROM user_task WHERE user_id = ${user_id}`;
//         db.query(
//           `SELECT * FROM user_task WHERE user_id = ${user_id}`,
//           (err, data_user_task) => {
//             if (err) throw err;
//             // console.log(data_user[0].id);
//             if (data_user_task.length < 1) {
//               data_user.forEach((element) => {
//                 rt_data.push({
//                   user_name: element.name,
//                 });
//               });
//               return res.send(rt_data);
//               // res.send("Không có trong cơ sở dữ liệu");
//             } else {
//               db.query(`SELECT * FROM status `, (err, data) => {
//                 if (err) throw err;
//                 let list_status = data.map((element) => {
//                   // console.log(element.id);
//                   return element;
//                 });
//                 // res.send(list_status);
//                 const sql = `SELECT user.name as user_name, task.name as task_name, task.status AS status   FROM  user_task
//                 INNER JOIN task ON task.id = user_task.task_id
//                 INNER JOIN user ON user.id = user_task.user_id
//                 where user_task.user_id= ${user_id}`;
//                 db.query(sql, function (err, data) {
//                   if (err) throw err;
//                   // res.send(data);
//                   let list_task = data.map((element) => {
//                     return element;
//                   });
//                   // res.send(list_task);
//                   list_task.forEach((element) => {
//                     // console.log("element", element);
//                     const status = list_status.find(
//                       (i) => element.status == i.id
//                     );
//                     // console.log(status);
//                     rt_data.push({
//                       user_name: element.user_name,
//                       task_name: element.task_name,
//                       status: status.name,
//                     });
//                   });
//                   res.send(rt_data);
//                 });
//               });
//             }
//           }
//         );
//       }
//     });
//   }
// });

app.get("/api/user-task-select/user/:id", (req, res) => {
  // let rt_data = [];
  const user_id = req.params.id;
  if (user_id) {
    const sql_check = `SELECT * FROM user WHERE id = ${user_id}`;
    db.query(sql_check, (err, data_user) => {
      if (err) throw err;
      if (data_user.length < 1) {
        return res.send("Không có trong cơ sở dữ liệu");
      } else {
        const sql = `SELECT user.id as user_id,user.name as user_name , task.name as task_name, status.name as status_name FROM user 
        LEFT JOIN user_task ON user.id = user_task.user_id
        LEFT JOIN task ON user_task.task_id = task.id
        LEFT JOIN status ON task.status = status.id
        WHERE user.id =  ${user_id}`;
        db.query(sql, function (err, data) {
          if (err) throw err;
          res.send(data);
        });
      }
    });
  }
});

// SELECT user.id as  user_id, user.name as user_name FROM user, user_task
// WHERE user.id != user_task.user_id

// lấy user không làm task nào

// sửa cú pháp api
app.get("/api/user-task-select/user-no-task", (req, res) => {
  let sql = `SELECT user.id as user_id,user.name as user_name FROM user 
  LEFT JOIN user_task ON user.id = user_task.user_id
  WHERE user_task.user_id IS null`;
  db.query(sql, (err, data) => {
    if (err) throw err;
    res.send(data);
  });
});
// lấy task mà không user nào làm
app.get("/api/user-task-select/task-no-user", (req, res) => {
  let sql = `SELECT task.name,task.status FROM task
  LEFT JOIN user_task ON task.id = user_task.task_id
  WHERE user_task.task_id IS null`;
  db.query(sql, (err, data) => {
    if (err) throw err;
    res.send(data);
  });
});
// xoá những task mà không có user làm
app.delete("/api/user-task-delete/task-no-user", (req, res) => {
  let sql = `DELETE task
FROM task
        LEFT JOIN
    user_task ON task.id = user_task.task_id 
WHERE
    user_task.task_id IS NULL;`;
  db.query(sql, (err, data) => {
    if (err) throw err;
    res.send("Xoá thành công");
  });
});

// đưa 1 mảng vào trong 1 task
app.post("/api/user-task-add", (req, res) => {
  const map1 = new Map();
  const user_id = req.body.user_id;
  const task_id = req.body.task_id;
  if (user_id && task_id) {
    user_id.forEach((el) => {
      // console.log(el);
      let sql = `INSERT INTO user_task( user_id, task_id) VALUES ('${el}','${task_id}')`;
      db.query(sql, (err, data) => {
        if (err) throw err;
        // res.send("thanh cong");
      });
    });
    res.send("thanh cong");
  } else {
    res.send("Bao loi");
  }
});

app.post("/api/user-task-update/:id", (req, res) => {
  const id = req.params.id;
  const user_id = req.body.user_id;
  const task_id = req.body.task_id;
  if (id) {
    const sql_check = `SELECT * FROM user_task WHERE id = ${id}`;
    db.query(sql_check, (err, data) => {
      if (err) throw err;
      if (data.length < 1) {
        return res.send("Không có trong cơ sở dữ liệu");
      } else {
        if (
          user_id &&
          typeof user_id == "number" &&
          task_id &&
          typeof task_id == "number"
        ) {
          let sql = `UPDATE user_task SET user_id='${user_id}',task_id='${task_id}' WHERE id = ${id}`;
          db.query(sql, (err, data) => {
            if (err) throw err;
            res.send("Sửa thành công");
          });
        } else {
          res.send("Nhập lại user_id,task_id");
        }
      }
    });
  } else {
    res.send("Nhập vào id");
  }
});
app.delete("/api/user-task-delete/:id", (req, res) => {
  const id = req.params.id;
  if (id) {
    const sql_check = `SELECT * FROM user_task WHERE id = ${id}`;
    db.query(sql_check, (err, data) => {
      if (err) throw err;
      if (data.length < 1) {
        return res.send("Không có trong cơ sở dữ liệu");
      } else {
        let sql = `DELETE FROM user_task WHERE id  = ${id}`;
        db.query(sql, (err, data) => {
          if (err) throw err;
          res.send("Xoá thành công");
        });
      }
    });
  } else {
    res.send("Nhập vào id");
  }
});
//========================================
//check xem có dữ liệu đưa vào đúng form hay chưa
// check kiểu dữ liệu đã đúng hay chưa
// nếu đúng kiểu dữ liệu, và có dữ liệu đưa vào
// check từng kiểu trạng thái đối với từng số trả về log, biểu thị trạng thái
// đẩy dữ liệu lên database
// done
// include và index

//================================
// app.post("/taskcreate",(req,res)=>{
//   const name = req.body.name;

//==================================
app.post("/api/task-create", (req, res) => {
  const name = req.body.name;
  let status = 1;
  let checkStatus = [1, 2, 3, 4];
  if (name && typeof name == "string") {
    if (checkStatus.includes(req.body.status)) {
      status = req.body.status;
    } else {
      return res.send("Lỗi");
    }
    let sql = `INSERT INTO task(name, status) VALUES ('${name}',${status})`;
    db.query(sql, function (err, data) {
      console.log(err);
      if (err) throw err;
      res.send("Post thành công");
    });
  } else res.send("Nhập lại dữ liệu theo đúng form 1 ");
});
//===================================

app.get("/api/task-select", (req, res) => {
  const sql = `SELECT * FROM task`;
  db.query(sql, function (err, data) {
    if (err) throw err;
    res.send(data);
  });
});

/**
 * Lấy ra id cần tìm,
Check trên data nếu không có thì trả về lỗi
Nếu có thì thực hiện câu lệnh sql hiển thị ra dữ liệu cần tìm
const sql = `SELECT task.id,task.name,status.name FROM  status
  INNER JOIN task
  ON status.id=task.status AND task.id= 85  
`;
  db.query(sql, function (err, data) {
    if (err) throw err;
    res.send(data);
  })
 */
//========================================
app.get("/api/task-check1/:id", (req, res) => {
  const id = req.params.id;
  if (id) {
    const sql_check = `SELECT * FROM task WHERE id = ${id}`;
    db.query(sql_check, (err, data) => {
      if (err) throw err;
      if (data.length < 1) {
        return res.send("Không có trong cơ sở dữ liệu");
      } else {
        const sql = `SELECT task.id,task.name,status.name as status FROM  status
        INNER JOIN task
        ON status.id=task.status
        where task.id= ${id}`;
        db.query(sql, function (err, data) {
          if (err) throw err;
          res.send(data);
        });
      }
    });
  }
});

// SELECT   user.name as name, task.name as task_name , task.status as status INTO save_data  FROM  user_task
//         INNER JOIN task ON task.id = user_task.task_id
//         INNER JOIN user ON user.id = user_task.user_id;
// SELECT save_data.name as user_name, save_data.name as name_task, status.name as status FROM status
// 		INNER JOIN save_data ON status.id=save_data.status

//=====
// SELECT user.name as user_name, task.name as name_task, task.status AS status   FROM  user_task
//         INNER JOIN task ON task.id = user_task.task_id
//         INNER JOIN user ON user.id = user_task.user_id
//         where user_task.id = 1

// SELECT   task.status INTO #save_data  FROM  user_task
// INNER JOIN task ON task.id = user_task.task_id
// INNER JOIN user ON user.id = user_task.user_id,
// SELECT user.name as user_name, task.name as name_task FROM status
// INNER JOIN save_data ON status.id=task.status
//=================================================
//update:
// lấy ra dữ liệu thông qua id
// dùng lệnh sql update lại thông tin name và status
//
app.post("/api/task-update/:id", (req, res) => {
  // const id = req.body.id;
  const id = req.params.id;
  const name = req.body.name;
  const status = [1, 2, 3, 4];
  // console.log(id);
  // res.send(req.params);
  // console.log(typeof id);
  if (id) {
    if (name && typeof name == "string") {
      if (status.includes(req.body.status)) {
        const sql = `UPDATE task SET name='${name}',status= ${req.body.status} WHERE id = ${id}`;
        db.query(sql, function (err, data) {
          if (err) throw err;
          res.send(data);
        });
      } else {
        return res.send("Nhập lại dữ liệu cần sửa");
      }
    } else res.send("Nhập lại dữ liệu cần sửa 2");
  }
});

// đưa vào id cần xoá
// lấy ra id, kiểm tra xem id có tồn tại trong data không
// không tồn tại, return ra lỗi
// nếu tồn tại dữ liệu có id đó, viết câu lệnh sql xoá trên data
// done
//==================================================
app.delete("/api/task-delete/:id", (req, res) => {
  const id = req.params.id;
  let sql = `DELETE FROM task WHERE id= ${id}`;
  let sql_check = `SELECT * FROM task WHERE id = ${id}`;
  // console.log("===========================");
  if (id) {
    db.query(sql_check, (err, data) => {
      if (err) throw err;
      if (data.length < 1) {
        return res.send("Lỗi rồi, không thấy id trong data");
      } else {
        db.query(sql, (err, data) => {
          if (err) throw err;
          res.send("xoa thanh cong");
        });
      }
    });
  }
  // else {
  //   return res.send("Truyền vào id");
  // }
});

// app.get("/taskselect", (req, res) => {
//   const id = req.body.id;
//   if (id && typeof id == "number") {
//     const sql = `SELECT * FROM task WHERE id = ${id}`;
//     db.query(sql, function (err, data) {
//       if (err) throw err;
//       if (data.length >= 1) {
//         res.send(data);
//       } else {
//         return res.send("Dữ liệu không tồn tại");
//       }
//     });
//   } else {
//     return res.send("Nhập lại dữ liệu cần tìm");
//   }
// });

// app.get("/taskselect", (req,res) =>{
//   const id = req.body.id
//   if(id && typeof(id)=='number'){
//   const sql = `SELECT * FROM task WHERE id = ${id}`
//   // res.send(sql)
//   db.query(sql,function(err,data){
//     if(err) throw err
//     res.send(data)
//   })
//   }
// });
// app.put("/taskselect", (req,res) =>{
//   const id = req.body.id
//   if(id && typeof(id)=='number'){
//   const sql = `SELECT * FROM task WHERE id = ${id}`
//   // res.send(sql)
//   db.query(sql,function(err,data){
//     if(err) throw err
//     if(data){
//       res.send(data)
//     }
//   })
//   }
// });

// app.post("/taskcreate", (req,res) =>{
//   const name = res.body.name
//   const status = res.body.status
//   if(name&&status){
//     if(typeof(name) == 'string'&&typeof(status)== 'number'){
//       switch (status) {
//         case 1: console.log("Chưa làm");
//         // break
//         case 2: console.log("Đang làm");
//         // break
//         case 3: console.log("Đã làm");
//         // break
//         case 4: console.log("Đã xoá");
//         // break
//         default:
//           console.log("Nhập status với giá trị 1/2/3/4");
//         break
//       }
//     }
//     else {
//       res.send("Nhập lại dữ liệu theo đúng form")
//     }
//   }
//   else{
//     res.send("Nhập lại dữ liệu theo đúng form")
//   }
//     // res.send(datapost)
// });

//===================================================================
// app.get('/task', (req, res) => {
//   // console.log('req', req);
//   // console.log('res', res);
//   console.log(task);
//   res.send(task)
// })

// app.post('/task', (req, res) => {
//   console.log(req.body)
//   task.push(req.body)
//   res.send(task)
// })

// app.put('/task', (req, res) => {

//   console.log(req.body);
//   // task.push(req.body)
//   const index = task.findIndex(function(el){
//     return el.id === req.body.id
//   })
//   console.log(index);
//   task[index]= req.body
//   res.send(task)
// })
// app.delete('/task', (req, res) => {
//   console.log(req.body);
//   // const newarray = task.filter(function(el){
//   //   return el.id !== req.body.id.forEach(element => {
//   //     return element
//   //   });
//   // })

//   let newarray = task

//   req.body.id.forEach(element => {
//     console.log(element);
//     newarray = newarray.filter(function(el){
//       return el.id !== element
//     })
//   });

//   res.send(newarray)
// })

// const task = [
//   {
//     id: 1,
//     task: 'btvn',
//     status: 'success'
//   },
//   {
//     id: 2,
//     task: 'btvn2',
//     status: 'success'
//   },
//   {
//     id: 3,
//     task: 'btvn3',
//     status: 'success'
//   }
// ]
