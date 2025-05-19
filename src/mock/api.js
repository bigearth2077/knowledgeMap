// src/mock/api.js
import Mock from 'mockjs'

Mock.mock(/\/api\/graph/, 'get', () => {
  const categories = ['概念', '算法与方法', '实际应用', '实战案例', '论文', '教材']
  const predicates = ['包含', '参考', '平行', '后继', '前驱']

  // 核心实体池（强化学习关键概念）
  const coreEntities = [
    {
      entity: '强化学习',
      category: '概念',
      attrs: [
        { attribute: '定义', value: '通过试错学习决策的系统' },
        { attribute: '提出者', value: 'Richard S. Sutton' },
      ],
    },
    {
      entity: 'Q-Learning',
      category: '算法与方法',
      attrs: [
        { attribute: '类型', value: '无模型算法' },
        { attribute: '提出时间', value: 1992 },
      ],
    },
    {
      entity: '深度强化学习',
      category: '算法与方法',
      attrs: [
        { attribute: '经典算法', value: 'DQN' },
        { attribute: '应用领域', value: '游戏AI' },
      ],
    },
    {
      entity: 'AlphaGo',
      category: '实战案例',
      attrs: [
        { attribute: '版本', value: 'AlphaGo Zero' },
        { attribute: '对战成绩', value: '60连胜职业棋手' },
      ],
    },
  ]

  // 生成200个实体（包含4个核心实体+196个随机实体）
  const entityPool = [...coreEntities]
  for (let i = 0; i < 96; i++) {
    const category = Mock.Random.pick(categories)
    entityPool.push({
      entity:
        Mock.Random.title(3, 5) + ' ' + Mock.Random.pick(['算法', '模型', '理论', '应用', '框架']),
      category: category,
      attrs: generateAttributes(category),
    })
  }

  // 转换最终实体结构
  const entities = entityPool.map((item) => ({
    entity: item.entity,
    category: item.category,
    attributes: item.attrs.concat({
      attribute: '研究热度',
      value: Mock.Random.float(3, 5).toFixed(1),
    }),
    count: Mock.Random.integer(10, 1000),
    weight: Mock.Random.float(0.5, 1.0).toFixed(2),
  }))

  // 生成关系（约400个关系）
  const relations = []
  // 1. 核心关系
  relations.push(
    { subject: '强化学习', object: 'Q-Learning', predicate: '包含' },
    { subject: 'Q-Learning', object: '深度强化学习', predicate: '前驱' },
    { subject: '深度强化学习', object: 'AlphaGo', predicate: '应用' },
  )

  // 2. 随机生成关系（保证连接有效性）
  for (let i = 0; i < 150; i++) {
    const [s, o] = getValidPair(entityPool)
    relations.push({
      subject: s.entity,
      object: o.entity,
      predicate: Mock.Random.pick(predicates),
    })
  }

  return Mock.mock({
    entities: entities.slice(0, 100), // 精确控制200个实体
    relations: relations,
  })

  // 生成属性逻辑
  function generateAttributes(category) {
    const base = [
      { attribute: '研究机构', value: Mock.Random.pick(['MIT', 'Stanford', 'DeepMind', 'OpenAI']) },
      { attribute: '提出时间', value: Mock.Random.integer(2000, 2023) },
    ]

    switch (category) {
      case '算法与方法':
        base.push({
          attribute: '算法类型',
          value: Mock.Random.pick(['无模型', '基于模型', '策略梯度', '值函数']),
        })
        break
      case '实战案例':
        base.push({
          attribute: '应用行业',
          value: Mock.Random.pick(['游戏', '机器人控制', '金融交易', '自动驾驶']),
        })
        break
      case '论文':
        base.push({
          attribute: '期刊会议',
          value: Mock.Random.pick(['NeurIPS', 'ICML', 'AAAI', 'Nature']),
        })
    }
    return base
  }

  // 获取有效实体对
  function getValidPair(pool) {
    const s = Mock.Random.pick(pool)
    let o = Mock.Random.pick(pool)
    let retry = 3
    while (o.entity === s.entity && retry-- > 0) {
      o = Mock.Random.pick(pool)
    }
    return [s, o]
  }
})

Mock.mock(/\/api\/search/, 'post', (options) => {
  const body = JSON.parse(options.body)
  const entity = body.entity

  // 生成动态数据
  return Mock.mock({
    entity: entity,
    category: Mock.Random.pick(['概念', '算法', '应用']),
    count: Mock.Random.integer(100, 5000),
    weight: Mock.Random.float(0.5, 5.0).toFixed(1),
    attributes: Array.from({ length: Mock.Random.integer(3, 8) }, () => ({
      attribute: Mock.Random.pick([
        '定义',
        '提出者',
        '应用领域',
        '最新版本',
        '核心算法',
        '相关论文',
      ]),
      value: Mock.Random.csentence(10, 30),
    })),
    relations: Array.from({ length: Mock.Random.integer(5, 15) }, () => [
      entity,
      Mock.Random.ctitle(3, 6),
      Mock.Random.pick(['包含', '参考', '应用', '扩展', '前驱']),
    ]),
  })
})

// 初始化教师数据
let teacherData = {
  name: Mock.Random.cname(),
  sex: Mock.Random.integer(0, 2),
  phone: Mock.Random.string('number', 11, 11).replace(/^(\d{3})\d{4}(\d{4})$/, '$1​**​​**​$2'),
  classes: Mock.mock({
    'array|1-3': [
      {
        className: '@ctitle(3,5)',
        classCode: '@integer(1000,9999)',
      },
    ],
  }).array,
}

// 拦截GET请求
Mock.mock(/\/api\/teacher$/, 'get', () => {
  return Mock.mock({
    code: 200,
    data: { ...teacherData },
    message: 'success',
  })
})

// 拦截PUT请求
Mock.mock(/\/api\/teacher$/, 'put', (options) => {
  const body = JSON.parse(options.body)

  // 验证班级代码是否被修改
  const invalidCodes = body.classes.filter((newClass, index) => {
    return newClass.classCode !== teacherData.classes[index]?.classCode
  })

  if (invalidCodes.length > 0) {
    return Mock.mock({
      code: 400,
      message: '班级代码不可修改',
    })
  }

  // 更新数据
  teacherData = {
    ...teacherData,
    name: body.name || teacherData.name,
    sex: body.sex ?? teacherData.sex,
    phone: body.phone || teacherData.phone,
    classes: teacherData.classes.map((origClass, index) => ({
      ...origClass,
      className: body.classes[index]?.className || origClass.className,
    })),
  }

  return Mock.mock({
    code: 200,
    data: { ...teacherData },
    message: '修改成功',
  })
})

// 设置请求延迟
Mock.setup({
  timeout: '200-400',
})

// 在已有的mock.js文件中添加以下内容
Mock.mock(/^\/api\/teacher\/study$/, 'get', () => {
  // 生成各分数段人数（总和控制在合理范围）
  const generateScores = () => ({
    'A|0-20': 0,
    'B|0-15': 0,
    'C|0-10': 0,
    'D|0-8': 0,
    'E|0-5': 0,
    'F|0-3': 0,
  })

  // 生成AI评语模板
  const comments = [
    '整体学情平稳，A段学生表现突出，建议加强F段学生的课后辅导。',
    '呈现两极分化趋势，需关注中间段学生的潜力挖掘。',
    '班级平均分处于年级中游，建议开展小组互助学习活动。',
    '近期学习状态有所提升，继续保持当前教学节奏。',
    '发现部分学生存在知识盲区，建议组织专题复习课程。',
  ]

  return Mock.mock({
    ...generateScores(),
    comment_ai: '@pick(comments)',
  })
})

// 模拟班级学生列表接口
Mock.mock(/\/api\/teacher\/class\?.*/, 'get', (options) => {
  const className = decodeURI(options.url.split('=')[1])

  return Mock.mock({
    'students|15-30': [
      {
        number: '@increment(1001)',
        name: '@cname',
        'sex|0-1': 1,
        major: '@pick(["计算机科学", "软件工程", "网络工程", "人工智能", "大数据"])',
      },
    ],
  })
})

// 模拟学生学情详情接口
Mock.mock(/\/api\/teacher\/student\?.*/, 'get', (options) => {
  const number = options.url.split('=')[1]

  return Mock.mock({
    'scoreHistories|3-8': [
      {
        judgement: '@csentence(15, 30)',
        'history|5-10': [
          {
            question: '@ctitle(8, 15)？',
            answer: '@csentence(20, 50)',
            score: '@pick(["A", "B", "C", "D", "E", "F"])',
          },
        ],
        timestamp: '@datetime("yyyy-MM-dd HH:mm")',
      },
    ],
    'completedEntities|30-100': 50,
    'totalEntities|100-200': 150,
    'weekStudyTime|10-60': 30,
    'totalStudyTime|100-500': 300,
  })
})

Mock.mock('/api/teacher/questions', 'get', () => {
  return Mock.mock({
    'questions|5-15': [
      // 这里需要用数组结构
      {
        'id|+1': 1, // 自动递增的ID
        question: '@csentence(15,50)',
      },
    ],
  })
})

Mock.mock('/api/teacher/questions', 'post', (options) => {
  const body = JSON.parse(options.body)
  return { code: 200, message: '添加成功' }
})

Mock.mock('/api/teacher/questions', 'put', (options) => {
  const body = JSON.parse(options.body)
  return { code: 200, message: '修改成功' }
})

Mock.mock('/api/teacher/questions', 'delete', (options) => {
  const body = JSON.parse(options.body)
  return { code: 200, message: '删除成功' }
})
