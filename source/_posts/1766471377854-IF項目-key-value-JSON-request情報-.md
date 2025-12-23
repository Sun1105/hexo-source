---
title: IF項目（key-value）➡ JSON（request情報）
category: VBA
tags: [TOOL]
date: 2025-12-23T06:29:37.853Z
---

'-------------------------------------------
' IF項目（key-value）➡ JSON（request情報）
' 导出当前激活工作表的树型结构数据为 JSON 文件
'-------------------------------------------
Sub ExportJsonFromExcelTreeLikeData()
    ' 定义工作表变量，指向当前活动工作表
    Dim ws As Worksheet
    Set ws = ActiveSheet

    ' 计算有效数据的最后一列列号
    Dim lastCol As Long
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column

    ' 计算有效数据的最后一行行号（可能列数不同，取最大行号）
    Dim lastRow As Long
    Dim c As Long
    lastRow = 1
    For c = 1 To lastCol
        ' 获取每一列最后一行
        Dim lr As Long
        lr = ws.Cells(ws.Rows.Count, c).End(xlUp).row
        ' 跟之前的最大行作对比，更新最大值
        If lr > lastRow Then lastRow = lr
    Next c

    ' 调用递归函数将表格内容转成 JSON 格式字符串
    Dim json As String
    json = ParseRows(ws, 1, lastRow, 1, lastCol)
    ' 删除结尾多余的逗号
    If Right(json, 1) = "," Then json = Left(json, Len(json) - 1)
    ' 外层加大括号
    json = "{" & json & "}"

    ' 弹出保存对话框，让用户选择保存路径与文件名
    Dim savePath As String
    savePath = Application.GetSaveAsFilename("output.json.txt", "Text Files (*.txt), *.txt")
    ' 如果用户取消，直接退出
    If savePath = "False" Then Exit Sub

    ' 使用 FileSystemObject 写入文件
    Dim fso As Object, ts As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.CreateTextFile(savePath, True, True)
    ' 写入 JSON 内容
    ts.Write json
    ts.Close
    ' 提示导出完成
    MsgBox "JSON取得完了: " & savePath, vbInformation
End Sub

'-------------------------------------------------
' 递归函数：将指定区域的数据解析为 JSON 片段字符串
' 参数：ws      - 工作表对象
'       startRow- 起始行
'       endRow  - 结束行
'       colLevel- 当前解析的层级（即列号）
'       maxLevel- 最大层级（最大列号）
' 返回：返回该区域的 JSON 字符串
'-------------------------------------------------
Function ParseRows(ws As Worksheet, startRow As Long, endRow As Long, colLevel As Long, maxLevel As Long) As String
    ' 保存本层 JSON 结果
    Dim result As String
    result = ""
    ' 当前遍历的行号
    Dim i As Long
    i = startRow

    Do While i <= endRow
        ' 获取本行本层的 key 值（如为空则跳过）
        Dim key As String
        key = Trim(ws.Cells(i, colLevel).value)
        If key <> "" Then
            ' 判断 key 是否定义为 _list 结尾，决定处理方式
            Dim isListKey As Boolean
            isListKey = (LCase(Right(key, 5)) = "_list")
            ' 标记是否有子级（分支/嵌套），默认无
            Dim hasChild As Boolean
            hasChild = False

            ' 判断下一行是否有下一级 key（用于分支判断）
            If i + 1 <= endRow And colLevel < maxLevel Then
                Dim nextLevelHasKey As Boolean
                nextLevelHasKey = False
                Dim k As Long
                For k = colLevel + 1 To maxLevel - 1
                    ' 检测下一行在更右侧的列是否有 key
                    If Trim(ws.Cells(i + 1, k).value) <> "" Then
                        nextLevelHasKey = True
                        Exit For
                    End If
                Next k
                If nextLevelHasKey Then hasChild = True
            End If

            ' 写入 key
            result = result & """" & key & """:"

            If isListKey Then
                '---- 处理 _list 型：为数组结构 ----
                Dim objs As String
                objs = ""
                ' curRow 指向数组第一个对象起始行
                Dim curRow As Long
                curRow = i + 1
                ' 循环处理每个数组元素对象
                Do While curRow <= endRow
                    ' 判断一级下没有子项则退出
                    If Trim(ws.Cells(curRow, colLevel + 1).value) = "" Then Exit Do
                    Dim obj As String
                    obj = ""
                    ' 保存本对象起始行
                    Dim startObjRow As Long
                    startObjRow = curRow
                    ' 遍历同一对象的所有字段
                    Dim nextObjRow As Long
                    nextObjRow = curRow
                    Do
                        Dim field As String
                        field = Trim(ws.Cells(nextObjRow, colLevel + 1).value)
                        ' 空字段即对象结束
                        If field = "" Then Exit Do
                        ' 获取字段值（最后一级列）
                        Dim value As String
                        value = ws.Cells(nextObjRow, maxLevel).value
                        obj = obj & """" & field & """:""" & EscJson(value) & ""","
                        ' 移动到下一行
                        nextObjRow = nextObjRow + 1
                        ' 超出表则对象结束
                        If nextObjRow > endRow Then Exit Do
                        ' 出现与当前字段名一样的，视为新对象开始，只在第一个对象以后触发
                        If Trim(ws.Cells(nextObjRow, colLevel + 1).value) = field And nextObjRow > startObjRow Then Exit Do
                        ' 左侧有新 key 出现也对象结束
                        If Trim(ws.Cells(nextObjRow, colLevel).value) <> "" Then Exit Do
                    Loop
                    ' 删除本对象末尾逗号
                    If Right(obj, 1) = "," Then obj = Left(obj, Len(obj) - 1)
                    ' 加入数组
                    objs = objs & "{" & obj & "},"
                    ' curRow 跳到下一个对象起始行
                    curRow = nextObjRow
                Loop
                ' 删除数组末尾逗号
                If Right(objs, 1) = "," Then objs = Left(objs, Len(objs) - 1)
                ' 拼成 JSON 数组
                result = result & "[" & objs & "],"
                ' 行号跳到数组结束（下个 key 行前）
                i = curRow - 1
            ElseIf hasChild Then
                '---- 递归处理普通嵌套对象结构 ----
                Dim childStart As Long
                childStart = i + 1
                Dim childEnd As Long
                childEnd = endRow
                Dim x As Long
                For x = i + 1 To endRow
                    ' 新 key 出现即本对象结束
                    If Trim(ws.Cells(x, colLevel).value) <> "" Then
                        childEnd = x - 1
                        Exit For
                    End If
                Next x
                ' 获取子对象的 JSON
                Dim childJson As String
                childJson = ParseRows(ws, childStart, childEnd, colLevel + 1, maxLevel)
                ' 删除末尾逗号
                If Right(childJson, 1) = "," Then childJson = Left(childJson, Len(childJson) - 1)
                ' 拼成 Object
                result = result & "{" & childJson & "},"
                ' 行号跳到子对象结束行
                i = childEnd
            Else
                '---- 普通叶节点，直接取该行最后一级列的内容 ----
                Dim val As String
                val = ""
                If colLevel < maxLevel Then
                    val = ws.Cells(i, maxLevel).value
                End If
                ' 写入转码内容
                result = result & """" & EscJson(val) & ""","
            End If
        End If
        ' 遍历下一行
        i = i + 1
    Loop
    ' 返回此层结果
    ParseRows = result
End Function

'-------------------------------------------
' 对字符串进行 JSON 必要的转义（如 \ " 等）
'-------------------------------------------
Function EscJson(str As String) As String
    str = Replace(str, "\", "\\")
    str = Replace(str, """", "\""")
    str = Replace(str, vbCrLf, "\n")
    str = Replace(str, vbLf, "\n")
    str = Replace(str, vbTab, "\t")
    EscJson = str
End Function
