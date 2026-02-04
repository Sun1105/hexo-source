---
title: 日本大手企业 IT 项目：Java + Spring Boot 全栈技术清单 (开发 ~ 运维)
date: 2026-02-04T13:47:42.109Z
categories: [全栈技术清单]
tags: [全栈技术清单]
---

在大手企业（如 NTT Data, Nomura Research Institute, Fujitsu 等）的开发环境中，**稳定性、安全性、可追踪性**是核心关键词。

---

## 一、 开发阶段 (Development)
主要关注代码的可维护性与团队协作。

### 1. 后端技术栈 (Backend Stack)
* **Java 17 / 21 (LTS):** 必须使用长期支持版本，Java 8 虽仍存在，但新项目已全面转向 17。
* **Spring Boot 3.x:** 标准框架。
* **Spring Security:** 结合 OAuth2 或 SAML 实现企业级单点登录 (SSO)。
* **MyBatis / Spring Data JPA:** * *MyBatis:* 日本传统项目青睐，便于 SQL 审查与性能调优。
    * *JPA:* 现代敏捷开发项目逐渐普及。
* **Lombok:** 减少冗余代码。
* **MapStruct:** 用于 DTO 与 Entity 之间的转换，提升转换性能和类型安全。

### 2. 前端技术栈 (Frontend Stack)
* **TypeScript:** 必选，为了强类型约束。
* **React / Angular:** 大手企业偏好，因为其组件化利于大型团队分工。
* **Next.js:** 在需要 SSR（服务端渲染）的 B2C 项目中非常流行。

### 3. API 与文档
* **OpenAPI (Swagger):** 生成 API 定义文件（YAML/JSON），作为前后端协作的唯一事实来源。

---

## 二、 设计与管理阶段 (Design & Management)
日本项目强调“设计先行”和“课题管理”。

* **Enterprise Architect / Astah:** 用于绘制 UML 图（类图、时序图）。
* **Backlog / Jira:** * *Backlog:* 日本本土最流行的课题管理工具。
    * *Jira:* 跨国或大规模敏捷项目首选。
* **Confluence:** 存储设计书（基本设计、详细设计）。

---

## 三、 构建与测试阶段 (Build & Test)
严密的质量把控是日本企业的特征。

* **Maven / Gradle:** 依赖管理。
* **JUnit 5 & Mockito:** 单元测试标准。
* **SonarQube:** **强制性静态代码分析**。检查 Bug、漏洞和代码异味（Code Smell），通常作为 CI 门禁。
* **Playwright / Selenium:** 浏览器自动化测试，用于集成测试阶段。

---

## 四、 基础设施与部署 (Infrastructure & CD)
目前主流是 AWS 环境下的容器化部署。

* **AWS 核心服务:** EKS (Kubernetes), RDS (Aurora), S3, CloudFront。
* **Terraform:** IaC (基础架构即代码)，确保不同环境（ST, UAT, PROD）的配置一致性。
* **Docker:** 环境隔离。
* **GitHub Actions / GitLab CI:** 自动化流水线。
* **Argo CD:** 针对 K8s 的 GitOps 持续交付工具。

---

## 五、 运行、监控与维护 (Ops & Observability)
这是“运维保守”阶段的核心，强调对故障的快速发现和原因定位。

* **Prometheus & Grafana:** 指标监控（CPU、内存、JVM 堆内存占用）。
* **ELK Stack (Elasticsearch, Logstash, Kibana):** 分布式日志收集与检索。
* **Datadog / New Relic (APM):** 应用性能管理，可追踪到具体的 SQL 慢查询或 API 响应延迟。
* **PagerDuty:** 紧急告警通知系统，直接对接开发/运维人员的手机。

---

## 六、 流程总览表

| 阶段 | 核心技术/工具 | 具体作用 |
| :--- | :--- | :--- |
| **1. 需求 (Req)** | Miro, Backlog | 收集业务需求，定义 User Story 和 Epic。 |
| **2. 设计 (Design)** | Astah, Confluence | 编写 BD (基本设计) 和 DD (详细设计)，绘制时序图。 |
| **3. 开发 (Dev)** | Java 17, Spring Boot | 实现业务逻辑，遵循严格的编码规范。 |
| **4. 管理 (SCM)** | Git (GitHub/GitLab) | 分支管理（通常采用 Gitflow 模式）。 |
| **5. 测试 (Test)** | SonarQube, JUnit | **自动化质量把关**，确保覆盖率达到企业标准（通常 80%+）。 |
| **6. 集成 (CI)** | Jenkins, GitLab CI | 自动构建镜像，运行测试套件。 |
| **7. 部署 (CD)** | Terraform, Argo CD | 将应用发布至 AWS 环境，实现无损更新（Blue/Green）。 |
| **8. 运行 (Run)** | AWS EKS, Aurora | 提供高可用、可扩展的生产运行环境。 |
| **9. 监控 (Mon)** | Datadog, Grafana | 实时观察系统负载，通过可视化面板展示系统健康状况。 |
| **10. 维护 (Maint)** | ELK Stack, Slack | 根据日志排查线上故障（障害対応），进行补丁更新。 |

---

### 💡 您的下一步建议：
针对这种大型项目，您是否需要我为您生成一份 **“大手企业标准的 CI/CD 流水线配置文件 (GitHub Actions/GitLab CI)”** 或者 **“典型的生产环境监控指标检查清单 (Checklist)”**？