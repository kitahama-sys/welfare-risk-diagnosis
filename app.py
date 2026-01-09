# -*- coding: utf-8 -*-
"""
福祉事業所 経営リスク診断アプリケーション
Welfare Business Risk Diagnosis Application
- デュアル診断機能（経営者・管理者の認識ギャップ可視化）対応版

Tech Stack: Streamlit + Plotly + Pandas
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from datetime import datetime
import hashlib

# ページ設定
st.set_page_config(
    page_title="福祉経営リスク診断",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# カスタムCSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1E3A5F;
        text-align: center;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #5A6C7D;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 12px;
        color: white;
        text-align: center;
    }
    .risk-high { color: #E53E3E; font-weight: bold; }
    .risk-medium { color: #DD6B20; font-weight: bold; }
    .risk-low { color: #38A169; font-weight: bold; }
    .gap-warning {
        background: linear-gradient(135deg, #FED7D7, #FEB2B2);
        border-left: 5px solid #E53E3E;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    .gap-item {
        background: #FFF5F5;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        margin: 0.5rem 0;
        border-left: 3px solid #E53E3E;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 24px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        padding: 10px 24px;
        font-size: 1.1rem;
    }
</style>
""", unsafe_allow_html=True)

# 質問データの定義（拡充版）
SOFT_QUESTIONS = [
    {
        "id": "soft_1",
        "category": "人材定着",
        "question": "職員間のコミュニケーションは活発ですか？",
        "description": "日常的な会話、情報共有、相談のしやすさを評価"
    },
    {
        "id": "soft_2",
        "category": "人材定着",
        "question": "退職理由のヒアリング・記録を行っていますか？",
        "description": "退職者への面談実施と記録の有無を評価"
    },
    {
        "id": "soft_3",
        "category": "育成",
        "question": "新人職員への教育体制は整っていますか？",
        "description": "OJT計画、マニュアル、メンター制度の有無を評価"
    },
    {
        "id": "soft_4",
        "category": "育成",
        "question": "管理者のマネジメント能力は十分ですか？",
        "description": "経営数字の理解、部下育成、方針の翻訳力を評価"
    },
    {
        "id": "soft_5",
        "category": "理念",
        "question": "法人の理念・ビジョンは職員に浸透していますか？",
        "description": "理念の説明機会、日常業務への反映度を評価"
    },
    {
        "id": "soft_6",
        "category": "コミュニケーション",
        "question": "経営者と現場職員が直接会話する機会はありますか？",
        "description": "経営層と現場の接点頻度を評価"
    },
    {
        "id": "soft_7",
        "category": "コミュニケーション",
        "question": "職員が上司に「言いにくいこと」を言える環境ですか？",
        "description": "心理的安全性、1on1面談、匿名アンケートの有無を評価"
    },
]

HARD_QUESTIONS = [
    {
        "id": "hard_1",
        "category": "人員基準",
        "question": "人員配置基準を常に満たしていますか？",
        "description": "常勤換算の計算、基準遵守状況を評価"
    },
    {
        "id": "hard_2",
        "category": "人員基準",
        "question": "サービス管理責任者の配置は適正ですか？",
        "description": "資格要件、配置基準の遵守を評価"
    },
    {
        "id": "hard_3",
        "category": "記録",
        "question": "個別支援計画は定期的に更新されていますか？",
        "description": "6ヶ月ごとの見直し、モニタリング記録を評価"
    },
    {
        "id": "hard_4",
        "category": "記録",
        "question": "サービス提供記録は適切に作成されていますか？",
        "description": "当日記録、内容の正確性、保管状況を評価"
    },
    {
        "id": "hard_5",
        "category": "安全管理",
        "question": "虐待防止委員会は設置・運営されていますか？",
        "description": "委員会設置、定期開催、研修実施を評価"
    },
    {
        "id": "hard_6",
        "category": "安全管理",
        "question": "BCP（業務継続計画）は策定・訓練されていますか？",
        "description": "BCP策定、年1回以上の訓練実施を評価"
    },
    {
        "id": "hard_7",
        "category": "加算管理",
        "question": "取得可能な加算を把握・算定できていますか？",
        "description": "加算要件の理解、算定漏れの有無を評価"
    },
]

# 象限の定義
QUADRANT_DEFINITIONS = {
    "ホワイト優良経営": {
        "description": "組織も法令遵守も高水準。継続的な改善で更なる成長を。",
        "color": "#38A169",
        "recommendation": "現状維持しつつ、次のステージへの投資を検討してください。"
    },
    "砂上の楼閣": {
        "description": "収益は上がっているが、人が離れるリスクあり。",
        "color": "#ECC94B",
        "recommendation": "組織マネジメントの強化が急務です。一斉退職リスクに注意。"
    },
    "万年貧乏": {
        "description": "人は良いが、稼げていない・記録不備のリスクあり。",
        "color": "#ED8936",
        "recommendation": "加算取得の最適化、記録体制の整備を優先してください。"
    },
    "崩壊寸前": {
        "description": "組織・法令の両面で危機的状況。即時介入が必要。",
        "color": "#E53E3E",
        "recommendation": "専門家への相談を強く推奨します。優先順位を付けた改善を。"
    }
}


def generate_session_id():
    """診断セッションIDを生成"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"DIAG-{timestamp}"


def calculate_scores(responses: dict) -> dict:
    """回答からスコアを計算"""
    soft_scores = []
    hard_scores = []
    
    category_scores = {
        "人材定着": [],
        "育成": [],
        "理念": [],
        "コミュニケーション": [],
        "人員基準": [],
        "記録": [],
        "安全管理": [],
        "加算管理": []
    }
    
    for q in SOFT_QUESTIONS:
        score = responses.get(q["id"], 3)
        soft_scores.append(score)
        if q["category"] in category_scores:
            category_scores[q["category"]].append(score)
    
    for q in HARD_QUESTIONS:
        score = responses.get(q["id"], 3)
        hard_scores.append(score)
        if q["category"] in category_scores:
            category_scores[q["category"]].append(score)
    
    # 各カテゴリの平均を計算
    radar_scores = {}
    for cat, scores in category_scores.items():
        radar_scores[cat] = np.mean(scores) if scores else 0
    
    # 総合スコア（100点満点に変換）
    soft_total = (np.mean(soft_scores) / 5) * 100 if soft_scores else 0
    hard_total = (np.mean(hard_scores) / 5) * 100 if hard_scores else 0
    
    return {
        "soft_score": soft_total,
        "hard_score": hard_total,
        "radar_scores": radar_scores,
        "soft_raw": soft_scores,
        "hard_raw": hard_scores
    }


def determine_quadrant(soft_score: float, hard_score: float) -> str:
    """スコアから象限を判定"""
    threshold = 60  # 60点を境界とする
    
    if soft_score >= threshold and hard_score >= threshold:
        return "ホワイト優良経営"
    elif soft_score < threshold and hard_score >= threshold:
        return "砂上の楼閣"
    elif soft_score >= threshold and hard_score < threshold:
        return "万年貧乏"
    else:
        return "崩壊寸前"


def calculate_gap_analysis(exec_responses: dict, mgr_responses: dict) -> pd.DataFrame:
    """経営者と管理者の回答ギャップを分析"""
    all_questions = SOFT_QUESTIONS + HARD_QUESTIONS
    gaps = []
    
    for q in all_questions:
        qid = q["id"]
        exec_score = exec_responses.get(qid, 3)
        mgr_score = mgr_responses.get(qid, 3)
        gap = exec_score - mgr_score
        
        q_type = "Soft" if qid.startswith("soft") else "Hard"
        
        gaps.append({
            "id": qid,
            "category": q["category"],
            "question": q["question"],
            "type": q_type,
            "executive_score": exec_score,
            "manager_score": mgr_score,
            "gap": gap,
            "abs_gap": abs(gap)
        })
    
    return pd.DataFrame(gaps)


def create_quadrant_chart(soft_score: float, hard_score: float, 
                          mgr_soft: float = None, mgr_hard: float = None) -> go.Figure:
    """4象限リスクマトリクスを作成（デュアル対応）"""
    fig = go.Figure()
    
    # 背景の象限を描画
    fig.add_shape(type="rect", x0=0, y0=0, x1=60, y1=60,
                  fillcolor="rgba(229, 62, 62, 0.3)", line=dict(width=0))
    fig.add_shape(type="rect", x0=60, y0=0, x1=100, y1=60,
                  fillcolor="rgba(236, 201, 75, 0.3)", line=dict(width=0))
    fig.add_shape(type="rect", x0=0, y0=60, x1=60, y1=100,
                  fillcolor="rgba(237, 137, 54, 0.3)", line=dict(width=0))
    fig.add_shape(type="rect", x0=60, y0=60, x1=100, y1=100,
                  fillcolor="rgba(56, 161, 105, 0.3)", line=dict(width=0))
    
    # 境界線
    fig.add_shape(type="line", x0=60, y0=0, x1=60, y1=100,
                  line=dict(color="gray", width=2, dash="dash"))
    fig.add_shape(type="line", x0=0, y0=60, x1=100, y1=60,
                  line=dict(color="gray", width=2, dash="dash"))
    
    # 象限ラベル
    annotations = [
        dict(x=30, y=30, text="崩壊寸前", font=dict(size=16, color="#E53E3E"), showarrow=False),
        dict(x=80, y=30, text="砂上の楼閣", font=dict(size=16, color="#B7791F"), showarrow=False),
        dict(x=30, y=80, text="万年貧乏", font=dict(size=16, color="#C05621"), showarrow=False),
        dict(x=80, y=80, text="ホワイト優良経営", font=dict(size=16, color="#276749"), showarrow=False),
    ]
    
    # 経営者のスコアをプロット
    fig.add_trace(go.Scatter(
        x=[hard_score],
        y=[soft_score],
        mode='markers+text',
        marker=dict(symbol='star', size=25, color='#1E3A5F', line=dict(color='white', width=2)),
        text=['経営者'],
        textposition='top center',
        textfont=dict(size=14, color='#1E3A5F'),
        name='経営者の認識'
    ))
    
    # デュアルモードの場合、管理者もプロット
    if mgr_soft is not None and mgr_hard is not None:
        fig.add_trace(go.Scatter(
            x=[mgr_hard],
            y=[mgr_soft],
            mode='markers+text',
            marker=dict(symbol='diamond', size=25, color='#E53E3E', line=dict(color='white', width=2)),
            text=['管理者'],
            textposition='top center',
            textfont=dict(size=14, color='#E53E3E'),
            name='管理者の認識'
        ))
        
        # ギャップを示す線
        fig.add_trace(go.Scatter(
            x=[hard_score, mgr_hard],
            y=[soft_score, mgr_soft],
            mode='lines',
            line=dict(color='red', width=3, dash='dash'),
            name='認識ギャップ'
        ))
    
    fig.update_layout(
        title=dict(
            text="リスク・マトリクス判定" + ("（経営者 vs 管理者）" if mgr_soft else ""),
            font=dict(size=20, color='#1E3A5F')
        ),
        xaxis=dict(
            title="コンプライアンス・収益健全性（Hard）",
            range=[0, 100],
            tickvals=[0, 20, 40, 60, 80, 100],
            gridcolor='lightgray'
        ),
        yaxis=dict(
            title="組織健全性（Soft）",
            range=[0, 100],
            tickvals=[0, 20, 40, 60, 80, 100],
            gridcolor='lightgray'
        ),
        annotations=annotations,
        plot_bgcolor='white',
        height=600,
        showlegend=True if mgr_soft else False,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    
    return fig


def create_gap_comparison_chart(gap_df: pd.DataFrame) -> go.Figure:
    """経営者と管理者の回答比較チャート"""
    fig = go.Figure()
    
    # 質問を短縮
    short_questions = [q[:15] + "..." if len(q) > 15 else q for q in gap_df['question']]
    
    fig.add_trace(go.Bar(
        name='経営者',
        x=short_questions,
        y=gap_df['executive_score'],
        marker_color='#1E3A5F',
        text=gap_df['executive_score'],
        textposition='outside'
    ))
    
    fig.add_trace(go.Bar(
        name='管理者',
        x=short_questions,
        y=gap_df['manager_score'],
        marker_color='#E53E3E',
        text=gap_df['manager_score'],
        textposition='outside'
    ))
    
    fig.update_layout(
        title='経営者 vs 管理者 回答比較',
        barmode='group',
        xaxis_tickangle=-45,
        height=500,
        yaxis=dict(range=[0, 6], title='スコア'),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    
    return fig


def create_dual_radar_chart(exec_scores: dict, mgr_scores: dict) -> go.Figure:
    """経営者と管理者のレーダーチャート比較"""
    categories = list(exec_scores.keys())
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatterpolar(
        r=[exec_scores[cat] for cat in categories] + [exec_scores[categories[0]]],
        theta=categories + [categories[0]],
        fill='toself',
        fillcolor='rgba(30, 58, 95, 0.3)',
        line=dict(color='#1E3A5F', width=2),
        name='経営者'
    ))
    
    fig.add_trace(go.Scatterpolar(
        r=[mgr_scores[cat] for cat in categories] + [mgr_scores[categories[0]]],
        theta=categories + [categories[0]],
        fill='toself',
        fillcolor='rgba(229, 62, 62, 0.3)',
        line=dict(color='#E53E3E', width=2),
        name='管理者'
    ))
    
    fig.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0, 5])
        ),
        title='カテゴリ別スコア比較（レーダーチャート）',
        showlegend=True,
        height=500
    )
    
    return fig


def create_radar_chart(radar_scores: dict) -> go.Figure:
    """レーダーチャートを作成（シングル用）"""
    categories = list(radar_scores.keys())
    values = [radar_scores[cat] for cat in categories]
    categories_closed = categories + [categories[0]]
    values_closed = values + [values[0]]
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatterpolar(
        r=values_closed,
        theta=categories_closed,
        fill='toself',
        fillcolor='rgba(30, 58, 95, 0.3)',
        line=dict(color='#1E3A5F', width=2),
        marker=dict(size=8, color='#1E3A5F'),
        name='診断結果'
    ))
    
    baseline = [3] * len(categories_closed)
    fig.add_trace(go.Scatterpolar(
        r=baseline,
        theta=categories_closed,
        line=dict(color='red', width=1, dash='dash'),
        name='基準ライン'
    ))
    
    fig.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0, 5], tickvals=[1, 2, 3, 4, 5])
        ),
        title=dict(text="カテゴリ別評価", font=dict(size=20, color='#1E3A5F')),
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=-0.2, xanchor="center", x=0.5),
        height=500
    )
    
    return fig


def render_question_form(questions: list, prefix: str, responder: str) -> dict:
    """質問フォームをレンダリング"""
    responses = {}
    for q in questions:
        st.markdown(f"**{q['question']}**")
        st.caption(q['description'])
        key = f"{prefix}_{q['id']}_{responder}"
        responses[q['id']] = st.slider(
            label=q['id'],
            min_value=1,
            max_value=5,
            value=3,
            key=key,
            label_visibility="collapsed"
        )
        st.divider()
    return responses


def main():
    # ヘッダー
    st.markdown('<h1 class="main-header">🏥 福祉事業所 経営リスク診断</h1>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">組織マネジメント（Soft）× 法令遵守（Hard）の2軸で貴法人のリスクを可視化します</p>', unsafe_allow_html=True)
    
    # セッションステートの初期化
    if 'diagnosis_mode' not in st.session_state:
        st.session_state.diagnosis_mode = "single"
    if 'session_id' not in st.session_state:
        st.session_state.session_id = None
    if 'executive_responses' not in st.session_state:
        st.session_state.executive_responses = None
    if 'manager_responses' not in st.session_state:
        st.session_state.manager_responses = None
    if 'single_responses' not in st.session_state:
        st.session_state.single_responses = {}
    if 'single_submitted' not in st.session_state:
        st.session_state.single_submitted = False
    
    # サイドバー
    with st.sidebar:
        st.header("📋 基本情報")
        
        business_type = st.selectbox(
            "事業種別",
            options=[
                "障がい者グループホーム",
                "訪問看護ステーション",
                "特別養護老人ホーム",
                "訪問介護",
                "放課後等デイサービス",
                "就労継続支援A型",
                "就労継続支援B型",
                "保育園",
                "その他"
            ],
            index=0
        )
        
        scale = st.selectbox(
            "事業所規模",
            options=[
                "1拠点・10名未満",
                "1拠点・10-30名",
                "2-5拠点・30-100名",
                "6拠点以上・100名以上"
            ],
            index=0
        )
        
        st.divider()
        
        # 診断モード選択
        st.header("🔄 診断モード")
        
        mode = st.radio(
            "診断モードを選択",
            ["シングル診断", "デュアル診断（推奨）"],
            help="デュアル診断では経営者と管理者の認識ギャップを可視化できます"
        )
        
        if mode == "デュアル診断（推奨）":
            st.session_state.diagnosis_mode = "dual"
            st.info("💡 経営者と管理者それぞれが回答し、認識のギャップを分析します。")
            
            if st.session_state.session_id is None:
                if st.button("🚀 新規診断セッションを開始", use_container_width=True):
                    st.session_state.session_id = generate_session_id()
                    st.session_state.executive_responses = None
                    st.session_state.manager_responses = None
                    st.rerun()
            else:
                st.success(f"セッションID:\n{st.session_state.session_id}")
                
                exec_done = st.session_state.executive_responses is not None
                mgr_done = st.session_state.manager_responses is not None
                
                st.markdown("**回答状況:**")
                st.markdown(f"- 経営者: {'✅ 完了' if exec_done else '⏳ 未回答'}")
                st.markdown(f"- 管理者: {'✅ 完了' if mgr_done else '⏳ 未回答'}")
                
                if st.button("🔄 セッションをリセット", use_container_width=True):
                    st.session_state.session_id = None
                    st.session_state.executive_responses = None
                    st.session_state.manager_responses = None
                    st.rerun()
        else:
            st.session_state.diagnosis_mode = "single"
        
        st.divider()
        
        st.markdown("""
        ### 📖 診断の使い方
        
        **シングル診断:**
        1. 質問に回答（1-5点）
        2. 診断結果を確認
        
        **デュアル診断:**
        1. セッションを開始
        2. 経営者が回答
        3. 管理者が回答
        4. ギャップ分析を確認
        
        **スコアの目安**
        - 5: 非常に良い
        - 4: 良い
        - 3: 普通
        - 2: やや不十分
        - 1: 不十分
        """)
    
    # メインエリア
    if st.session_state.diagnosis_mode == "dual" and st.session_state.session_id:
        # デュアル診断モード
        exec_done = st.session_state.executive_responses is not None
        mgr_done = st.session_state.manager_responses is not None
        
        if exec_done and mgr_done:
            # 両方完了 → レポート表示
            render_dual_report(business_type, scale)
        elif not exec_done:
            # 経営者の回答フォーム
            render_executive_form()
        else:
            # 管理者の回答フォーム
            render_manager_form()
    else:
        # シングル診断モード
        render_single_mode(business_type, scale)


def render_executive_form():
    """経営者用回答フォーム"""
    st.header("👔 経営者として回答してください")
    st.info("まず経営者（代表・理事長など）の視点で回答してください。回答後、管理者の方に同じ質問に回答していただきます。")
    
    tab1, tab2 = st.tabs(["📝 診断フォーム", "📋 回答状況"])
    
    with tab1:
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("👥 組織マネジメント（Soft）")
            soft_responses = render_question_form(SOFT_QUESTIONS, "soft", "executive")
        
        with col2:
            st.subheader("📋 法令遵守・収益（Hard）")
            hard_responses = render_question_form(HARD_QUESTIONS, "hard", "executive")
        
        if st.button("✅ 経営者の回答を確定", type="primary", use_container_width=True):
            st.session_state.executive_responses = {**soft_responses, **hard_responses}
            st.success("経営者の回答を保存しました。次は管理者の回答をお願いします。")
            st.rerun()
    
    with tab2:
        st.info("経営者の回答が完了すると、管理者の回答に進めます。")


def render_manager_form():
    """管理者用回答フォーム"""
    st.header("👷 管理者として回答してください")
    st.warning("⚠️ 経営者とは**別の方**（施設長・管理者など）が回答してください。")
    st.info("経営者の回答は完了しています。管理者の視点で正直に回答してください。")
    
    tab1, tab2 = st.tabs(["📝 診断フォーム", "📋 回答状況"])
    
    with tab1:
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("👥 組織マネジメント（Soft）")
            soft_responses = render_question_form(SOFT_QUESTIONS, "soft", "manager")
        
        with col2:
            st.subheader("📋 法令遵守・収益（Hard）")
            hard_responses = render_question_form(HARD_QUESTIONS, "hard", "manager")
        
        if st.button("✅ 管理者の回答を確定", type="primary", use_container_width=True):
            st.session_state.manager_responses = {**soft_responses, **hard_responses}
            st.success("管理者の回答を保存しました。診断レポートを表示します。")
            st.rerun()
    
    with tab2:
        st.success("✅ 経営者の回答: 完了")
        st.info("⏳ 管理者の回答: 入力中...")


def render_dual_report(business_type: str, scale: str):
    """デュアル診断レポートを表示"""
    st.header("📊 デュアル診断レポート")
    st.success("経営者・管理者の両方の回答が完了しました。認識ギャップを分析します。")
    
    # スコア計算
    exec_scores = calculate_scores(st.session_state.executive_responses)
    mgr_scores = calculate_scores(st.session_state.manager_responses)
    
    # ギャップ分析
    gap_df = calculate_gap_analysis(
        st.session_state.executive_responses,
        st.session_state.manager_responses
    )
    
    # 象限判定
    exec_quadrant = determine_quadrant(exec_scores['soft_score'], exec_scores['hard_score'])
    mgr_quadrant = determine_quadrant(mgr_scores['soft_score'], mgr_scores['hard_score'])
    
    # サマリー表示
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("経営者の認識", exec_quadrant)
        st.caption(f"Soft: {exec_scores['soft_score']:.1f}点 / Hard: {exec_scores['hard_score']:.1f}点")
    
    with col2:
        st.metric("管理者の認識", mgr_quadrant)
        st.caption(f"Soft: {mgr_scores['soft_score']:.1f}点 / Hard: {mgr_scores['hard_score']:.1f}点")
    
    with col3:
        avg_gap = gap_df['abs_gap'].mean()
        gap_level = "大" if avg_gap >= 1.5 else ("中" if avg_gap >= 0.8 else "小")
        st.metric("平均ギャップ", f"{avg_gap:.2f}点")
        st.caption(f"ギャップレベル: {gap_level}")
    
    st.divider()
    
    # 警告表示
    if exec_quadrant != mgr_quadrant:
        st.markdown(f"""
        <div class="gap-warning">
            <h3>⚠️ 重大な認識ギャップを検出</h3>
            <p>経営者は「<strong>{exec_quadrant}</strong>」と認識していますが、
            管理者は「<strong>{mgr_quadrant}</strong>」と認識しています。</p>
            <p>この認識のズレは、組織崩壊の予兆となる可能性があります。</p>
        </div>
        """, unsafe_allow_html=True)
    
    # 大きなギャップがある項目
    high_gap_items = gap_df[gap_df['abs_gap'] >= 2]
    if len(high_gap_items) > 0:
        st.warning("⚠️ **以下の項目で大きな認識ギャップ（2点以上）が検出されました：**")
        for _, row in high_gap_items.iterrows():
            direction = "経営者が高く評価" if row['gap'] > 0 else "管理者が高く評価"
            st.markdown(f"""
            <div class="gap-item">
                <strong>{row['question']}</strong><br>
                経営者: {row['executive_score']}点 / 管理者: {row['manager_score']}点 → {direction}
            </div>
            """, unsafe_allow_html=True)
    
    st.divider()
    
    # グラフ表示
    tab1, tab2, tab3, tab4 = st.tabs(["4象限マトリクス", "回答比較", "レーダーチャート", "詳細データ"])
    
    with tab1:
        fig = create_quadrant_chart(
            exec_scores['soft_score'], exec_scores['hard_score'],
            mgr_scores['soft_score'], mgr_scores['hard_score']
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with tab2:
        fig = create_gap_comparison_chart(gap_df)
        st.plotly_chart(fig, use_container_width=True)
    
    with tab3:
        fig = create_dual_radar_chart(exec_scores['radar_scores'], mgr_scores['radar_scores'])
        st.plotly_chart(fig, use_container_width=True)
    
    with tab4:
        display_df = gap_df[['category', 'question', 'executive_score', 'manager_score', 'gap']].copy()
        display_df.columns = ['カテゴリ', '質問', '経営者', '管理者', 'ギャップ']
        st.dataframe(display_df, use_container_width=True, hide_index=True)
    
    # 改善提案
    st.divider()
    st.header("💡 改善提案")
    
    if avg_gap >= 1.5:
        st.error("""
        ### 🚨 緊急対応が必要です
        
        経営者と管理者の間に大きな認識ギャップがあります。このまま放置すると、
        以下のリスクが顕在化する可能性があります：
        
        - 現場の不満蓄積による一斉退職
        - 実地指導での想定外の指摘
        - 内部告発や労働問題
        
        **推奨アクション：**
        1. 経営者と管理者で本診断結果を共有し、認識のすり合わせを行う
        2. 特にギャップの大きい項目について、現場の実態を確認する
        3. 定期的な1on1ミーティングを設定し、コミュニケーションを強化する
        """)
    elif avg_gap >= 0.8:
        st.warning("""
        ### ⚠️ 注意が必要です
        
        一部の項目で認識のズレが見られます。早めに対処することで、
        大きな問題に発展することを防げます。
        
        **推奨アクション：**
        1. ギャップのある項目について、双方の認識を確認する
        2. 情報共有の仕組みを見直す
        3. 定期的な振り返りの機会を設ける
        """)
    else:
        st.success("""
        ### ✅ 良好な状態です
        
        経営者と管理者の認識が概ね一致しています。
        この状態を維持するために、引き続きコミュニケーションを大切にしてください。
        
        **推奨アクション：**
        1. 現在の良好なコミュニケーションを継続する
        2. 定期的に本診断を実施し、変化を早期に検知する
        """)
    
    # 診断情報
    st.divider()
    st.caption(f"""
    **診断情報**
    - セッションID: {st.session_state.session_id}
    - 事業種別: {business_type}
    - 事業所規模: {scale}
    - 診断日: {datetime.now().strftime('%Y年%m月%d日')}
    """)


def render_single_mode(business_type: str, scale: str):
    """シングル診断モード"""
    st.info("💡 **デュアル診断モード**を選択すると、経営者と管理者の認識ギャップを可視化できます。サイドバーから選択してください。")
    
    tab1, tab2 = st.tabs(["📝 診断フォーム", "📊 診断レポート"])
    
    with tab1:
        st.header("診断質問")
        st.info("各質問に1〜5のスコアで回答してください。すべての質問に回答後、「診断を実行」ボタンを押してください。")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("👥 組織マネジメント（Soft）")
            for q in SOFT_QUESTIONS:
                st.markdown(f"**{q['question']}**")
                st.caption(q['description'])
                st.session_state.single_responses[q['id']] = st.slider(
                    label=q['id'],
                    min_value=1,
                    max_value=5,
                    value=st.session_state.single_responses.get(q['id'], 3),
                    key=f"single_{q['id']}",
                    label_visibility="collapsed"
                )
                st.divider()
        
        with col2:
            st.subheader("📋 法令遵守・収益（Hard）")
            for q in HARD_QUESTIONS:
                st.markdown(f"**{q['question']}**")
                st.caption(q['description'])
                st.session_state.single_responses[q['id']] = st.slider(
                    label=q['id'],
                    min_value=1,
                    max_value=5,
                    value=st.session_state.single_responses.get(q['id'], 3),
                    key=f"single_{q['id']}",
                    label_visibility="collapsed"
                )
                st.divider()
        
        if st.button("🔍 診断を実行", type="primary", use_container_width=True):
            st.session_state.single_submitted = True
            st.success("診断が完了しました！「診断レポート」タブで結果をご確認ください。")
    
    with tab2:
        if not st.session_state.single_submitted:
            st.warning("まず「診断フォーム」タブで質問に回答し、「診断を実行」ボタンを押してください。")
        else:
            scores = calculate_scores(st.session_state.single_responses)
            quadrant = determine_quadrant(scores['soft_score'], scores['hard_score'])
            quadrant_info = QUADRANT_DEFINITIONS[quadrant]
            
            st.header("診断結果サマリー")
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("組織健全性（Soft）", f"{scores['soft_score']:.1f}点")
            with col2:
                st.metric("コンプラ・収益健全性（Hard）", f"{scores['hard_score']:.1f}点")
            with col3:
                st.metric("総合判定", quadrant)
            
            st.divider()
            
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, {quadrant_info['color']}20, {quadrant_info['color']}40);
                border-left: 5px solid {quadrant_info['color']};
                padding: 1.5rem;
                border-radius: 8px;
            ">
                <h3 style="color: {quadrant_info['color']};">【{quadrant}】</h3>
                <p>{quadrant_info['description']}</p>
                <p><strong>💡 推奨アクション:</strong> {quadrant_info['recommendation']}</p>
            </div>
            """, unsafe_allow_html=True)
            
            st.divider()
            
            col1, col2 = st.columns(2)
            with col1:
                fig = create_quadrant_chart(scores['soft_score'], scores['hard_score'])
                st.plotly_chart(fig, use_container_width=True)
            with col2:
                fig = create_radar_chart(scores['radar_scores'])
                st.plotly_chart(fig, use_container_width=True)
            
            st.divider()
            st.caption(f"""
            **診断情報**
            - 事業種別: {business_type}
            - 事業所規模: {scale}
            - 診断日: {datetime.now().strftime('%Y年%m月%d日')}
            """)


if __name__ == "__main__":
    main()
