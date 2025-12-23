---
title: IF項目（key-value）➡ JSON（request情報）
category: VBA
tags: [TOOL]
date: 2025-12-23T06:53:06.863Z
---

'==================================================================================
'【概要】
' 本宏用于将当前激活工作表中的“树型结构”数据导出为 JSON 文件。
' 支持多级嵌套结构及数组结构（key以"_list"结尾）。
'
'【代码处理流程】
' 1. 计算有效数据的最大行与最大列。
' 2. 调用递归函数 ParseRows 将工作表内容解析为 JSON 字符串。
' 3. 若有多余的逗号结尾，进行清理。
' 4. 弹出保存对话框，选择文件保存路径。
' 5. 使用 FileSystemObject 写入 JSON 内容到文件。
' 6. 完成后弹窗提示。
'==================================================================================

'-------------------------------------------
' 主过程：导出树型结构数据为 JSON 文件
'-------------------------------------------
Sub ExportJsonFromExcelTreeLikeData()
    ' 定义并获取当前激活工作表
    Dim ws As Worksheet
    Set ws = ActiveSheet

    ' 计算有效数据的最后一列（最大有数据的列号）
    Dim lastCol As Long
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column

    ' 计算有效数据的最后一行（各列中最大有数据的行号）
    Dim lastRow As Long
    Dim c As Long
    lastRow = 1
    For c = 1 To lastCol
        ' 获取每列最后一个有数据的行号
        Dim lr As Long
        lr = ws.Cells(ws.Rows.Count, c).End(xlUp).Row
        ' 更新最大行号
        If lr > lastRow Then lastRow = lr
    Next c

    ' 将表格区域内容解析成 JSON 字符串
    Dim json As String
    json = ParseRows(ws, 1, lastRow, 1, lastCol)

    ' 删除末尾多余逗号
    If Right(json, 1) = "," Then json = Left(json, Len(json) - 1)
    ' 外层用大括号包裹
    json = "{" & json & "}"

    ' 选择保存路径与文件名（弹出保存文件对话框，默认文件名 output.json.txt）
    Dim savePath As String
    savePath = Application.GetSaveAsFilename("output.json.txt", "Text Files (*.txt), *.txt")
    ' 用户取消时直接退出
    If savePath = "False" Then Exit Sub

    ' 创建文件系统对象并写入 JSON 到文件
    Dim fso As Object, ts As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set ts = fso.CreateTextFile(savePath, True, True)
    ' 写入 JSON 内容并关闭文件流
    ts.Write json
    ts.Close

    ' 提示导出完成，并显示保存路径
    MsgBox "JSON取得完了: " & savePath, vbInformation
End Sub

'-------------------------------------------------
' 递归解析区域数据为 JSON 片段字符串
' ws       - 工作表对象
' startRow - 起始行号
' endRow   - 结束行号
' colLevel - 当前解析的层级（列号）
' maxLevel - 最大层级（列号）
' return   - 返回区域的 JSON 片段字符串
'-------------------------------------------------
Function ParseRows(ws As Worksheet, startRow As Long, endRow As Long, colLevel As Long, maxLevel As Long) As String
    ' 当前层级的 JSON 结果字符串
    Dim result As String
    result = ""
    ' 当前遍历到的行号
    Dim i As Long
    i = startRow

    Do While i <= endRow
        ' 获取本层级的 key（若本行本列为空则跳过）
        Dim key As String
        key = Trim(ws.Cells(i, colLevel).Value)
        If key <> "" Then
            ' 判断 key 是否以 "_list" 结尾（为数组类型）
            Dim isListKey As Boolean
            isListKey = (LCase(Right(key, 5)) = "_list")

            ' 标记是否有子级（下一级嵌套/分支），初始默认无
            Dim hasChild As Boolean
            hasChild = False

            ' 判断下一行是否在下一级层级有 key（用于判定有分支）
            If i + 1 <= endRow And colLevel < maxLevel Then
                Dim nextLevelHasKey As Boolean
                nextLevelHasKey = False
                Dim k As Long
                For k = colLevel + 1 To maxLevel - 1
                    ' 检查下一行更右侧是否有 key
                    If Trim(ws.Cells(i + 1, k).Value) <> "" Then
                        nextLevelHasKey = True
                        Exit For
                    End If
                Next k
                If nextLevelHasKey Then hasChild = True
            End If

            ' 写入 key 字符串
            result = result & """" & key & """:"

            If isListKey Then
                '----------------------------
                ' "_list"型（数组结构）处理
                '----------------------------
                Dim objs As String
                objs = ""  ' 用以存储所有元素的 JSON
                Dim curRow As Long
                curRow = i + 1  ' 指向数组第一个对象的起始行

                ' 循环处理数组中的每个对象元素
                Do While curRow <= endRow
                    ' 下一级（colLevel+1）如果没有字段说明，数组结束
                    If Trim(ws.Cells(curRow, colLevel + 1).Value) = "" Then Exit Do
                    Dim obj As String
                    obj = ""  ' 存储单个对象的 JSON
                    Dim startObjRow As Long
                    startObjRow = curRow  ' 本对象起始行
                    Dim nextObjRow As Long
                    nextObjRow = curRow  ' 用于遍历本对象的字段及内容

                    ' 遍历对象的所有字段行
                    Do
                        Dim field As String
                        field = Trim(ws.Cells(nextObjRow, colLevel + 1).Value)
                        ' 字段为空，对象结构结束
                        If field = "" Then Exit Do
                        ' 获取字段的值（最后一级列的内容，作为 value）
                        Dim value As String
                        value = ws.Cells(nextObjRow, maxLevel).Value
                        ' 写入字段所对应的 JSON key-value
                        obj = obj & """" & field & """:""" & EscJson(value) & ""","
                        ' 下移到下一行
                        nextObjRow = nextObjRow + 1
                        ' 超过表格最大行，对象结束
                        If nextObjRow > endRow Then Exit Do
                        ' 如果字段名重复且不是第一行，认为是新对象起始（防止同一字段名作为多个对象内容分割）
                        If Trim(ws.Cells(nextObjRow, colLevel + 1).Value) = field And nextObjRow > startObjRow Then Exit Do
                        ' 本层级有新 key，视为对象结束
                        If Trim(ws.Cells(nextObjRow, colLevel).Value) <> "" Then Exit Do
                    Loop

                    ' 清理对象末尾的多余逗号
                    If Right(obj, 1) = "," Then obj = Left(obj, Len(obj) - 1)
                    ' 用大括号包裹对象 JSON，并加入数组 JSON 字符串
                    objs = objs & "{" & obj & "},"
                    ' 跳到下一个对象起始行
                    curRow = nextObjRow
                Loop

                ' 清理数组末尾多余逗号
                If Right(objs, 1) = "," Then objs = Left(objs, Len(objs) - 1)
                ' 输出 JSON 数组
                result = result & "[" & objs & "],"
                ' 行号跳到数组结束下一个 key 开始处
                i = curRow - 1

            ElseIf hasChild Then
                '----------------------------
                ' 普通嵌套对象（递归处理分支）
                '----------------------------
                Dim childStart As Long
                childStart = i + 1  ' 子对象起始行
                Dim childEnd As Long
                childEnd = endRow   ' 子对象的结束行，默认到表尾
                Dim x As Long
                For x = i + 1 To endRow
                    ' 左侧新 key 出现，说明子对象结束
                    If Trim(ws.Cells(x, colLevel).Value) <> "" Then
                        childEnd = x - 1
                        Exit For
                    End If
                Next x

                ' 递归，获取子对象 JSON 字符串
                Dim childJson As String
                childJson = ParseRows(ws, childStart, childEnd, colLevel + 1, maxLevel)
                ' 清理末尾逗号
                If Right(childJson, 1) = "," Then childJson = Left(childJson, Len(childJson) - 1)
                ' 包裹成对象结构
                result = result & "{" & childJson & "},"
                ' 行号跳到子对象最后一行
                i = childEnd

            Else
                '----------------------------
                ' 普通叶节点（直接取内容）
                '----------------------------
                Dim val As String
                val = ""
                If colLevel < maxLevel Then
                    val = ws.Cells(i, maxLevel).Value
                End If
                ' 将内容写入 JSON 并进行必要转码
                result = result & """" & EscJson(val) & ""","
            End If
        End If
        ' 遍历到下一行
        i = i + 1
    Loop
    ' 返回本层级 JSON 结果
    ParseRows = result
End Function

'-------------------------------------------
' 字符串 JSON 转义函数
' str - 待处理字符串
' return - 返回转码后的字符串
'-------------------------------------------
Function EscJson(str As String) As String
    ' 替换反斜杠为双反斜杠
    str = Replace(str, "\", "\\")
    ' 替换英文双引号为带转义的双引号
    str = Replace(str, """", "\""")
    ' 替换换行回车为 \n
    str = Replace(str, vbCrLf, "\n")
    str = Replace(str, vbLf, "\n")
    ' 替换制表符为 \t
    str = Replace(str, vbTab, "\t")
    ' 返回处理结果
    EscJson = str
End Function
