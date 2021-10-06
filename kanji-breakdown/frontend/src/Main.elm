module Main exposing (..)

import Browser exposing (Document)
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, button, div, input, li, node, ol, span, text)
import Html.Attributes as HA exposing (attribute, height, placeholder, style, value, width)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Html.Lazy exposing (lazy, lazy2, lazy3, lazy4, lazy5, lazy6, lazy7, lazy8)
import Http
import Json.Decode as Decode
import Json.Encode as Encode
import List.Extra
import Platform.Cmd as Cmd
import Svg exposing (Svg)
import Svg.Attributes as SA exposing (stroke)
import Svg.Events
import SvgParser exposing (Element, SvgAttribute, SvgNode(..))
import Tuple exposing (second)
import Url.Builder exposing (absolute)
import VirtualDom



-- MAIN


rawsvg : List (Attribute msg) -> List (Html msg) -> Html msg
rawsvg =
    VirtualDom.node "raw-svg"


main =
    Browser.document
        { init = init
        , subscriptions = subscriptions
        , update = update
        , view = view
        }


dummy =
    [ WorkElement "a" "first" "note1" "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"109\" height=\"109\" viewBox=\"0 0 109 109\"><g xmlns:kvg=\"http://kanjivg.tagaini.net\" id=\"kvg:StrokePaths_04eba\" style=\"fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;\"><g id=\"kvg:04eba\" kvg:element=\"&#20154;\" kvg:radical=\"general\"><path id=\"kvg:04eba-s1\" kvg:type=\"&#12754;\" d=\"M54.5,20c0.37,2.12,0.23,4.03-0.22,6.27C51.68,39.48,38.25,72.25,16.5,87.25\"/><path id=\"kvg:04eba-s2\" kvg:type=\"&#12751;\" d=\"M46,54.25c6.12,6,25.51,22.24,35.52,29.72c3.66,2.73,6.94,4.64,11.48,5.53\"/></g></g></svg>" []
    , WorkElement "b" "second" "note2" "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"109\" height=\"109\" viewBox=\"0 0 109 109\"><g xmlns:kvg=\"http://kanjivg.tagaini.net\" id=\"kvg:StrokePaths_065e5\" style=\"fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;\"><g id=\"kvg:065e5\" kvg:element=\"&#26085;\" kvg:radical=\"general\"><path id=\"kvg:065e5-s1\" kvg:type=\"&#12753;\" d=\"M31.5,24.5c1.12,1.12,1.74,2.75,1.74,4.75c0,1.6-0.16,38.11-0.09,53.5c0.02,3.82,0.05,6.35,0.09,6.75\"/><path id=\"kvg:065e5-s2\" kvg:type=\"&#12757;a\" d=\"M33.48,26c0.8-0.05,37.67-3.01,40.77-3.25c3.19-0.25,5,1.75,5,4.25c0,4-0.22,40.84-0.23,56c0,3.48,0,5.72,0,6\"/><path id=\"kvg:065e5-s3\" kvg:type=\"&#12752;a\" d=\"M34.22,55.25c7.78-0.5,35.9-2.5,44.06-2.75\"/><path id=\"kvg:065e5-s4\" kvg:type=\"&#12752;a\" d=\"M34.23,86.5c10.52-0.75,34.15-2.12,43.81-2.25\"/></g></g></svg>" [ "first" ]
    , WorkElement "c" "third" "" "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"109\" height=\"109\" viewBox=\"0 0 109 109\"><g xmlns:kvg=\"http://kanjivg.tagaini.net\" id=\"kvg:StrokePaths_04e00\" style=\"fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;\"><g id=\"kvg:04e00\" kvg:element=\"&#19968;\" kvg:radical=\"general\"><path id=\"kvg:04e00-s1\" kvg:type=\"&#12752;\" d=\"M11,54.25c3.19,0.62,6.25,0.75,9.73,0.5c20.64-1.5,50.39-5.12,68.58-5.24c3.6-0.02,5.77,0.24,7.57,0.49\"/></g></g></svg>" [ "first", "second" ]
    ]



-- MODEL


type alias WorkElement =
    { kanji : String
    , keyword : String
    , note : String
    , svg : String
    , parts : List String
    }


type alias KeyCandidate =
    { word : String
    , metadata : String
    , freq : List Int
    }


type alias Model =
    { currentWork : WorkElement
    , kanji : String
    , similarKanji : List WorkElement
    , keyword : String
    , note : String
    , svg : String
    , svgSelectedId : String
    , parts : List WorkElement
    , currentParts : List String
    , workElements : List WorkElement
    , currentWorkIndex : Int
    , userMessage : Dict String String
    }


init : () -> ( Model, Cmd Msg )
init _ =
    let
        model =
            { currentWork = { kanji = "", keyword = "", note = "", svg = "", parts = [] }
            , kanji = ""
            , keyword = "loading..."
            , note = ""
            , svg = ""
            , svgSelectedId = ""
            , currentParts = []
            , parts = []
            , similarKanji = []
            , workElements = dummy

            -- , workElements = []
            , currentWorkIndex = -1
            , userMessage = Dict.empty
            }

        commands =
            Cmd.batch [ getWorkElements, getParts ]
    in
    -- update NextWorkElement model
    ( model, commands )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- UPDATE


type
    Msg
    -- work elements
    = NextWorkElement
    | SelectWorkElement Int
      -- Parts
    | SelectPart Int
      -- inputs
    | NotesInput String
    | KeywordSubmitClick
      -- Http responses
    | KeywordSubmitReady (Result Http.Error String)
    | WorkElementsReady (Result Http.Error (List WorkElement))
    | PartsReady (Result Http.Error (List WorkElement))
    | KeywordCheckReady (Result Http.Error (List WorkElement))
      -- Svg debug stuff
    | SvgClick String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        KeywordSubmitClick ->
            if String.length model.keyword > 0 then
                ( model, submitKeyword model )

            else
                ( { model | userMessage = Dict.insert "KeywordSubmitClick" "Error: keyword length must be non-zero" model.userMessage }, Cmd.none )

        KeywordSubmitReady result ->
            case result of
                Ok body ->
                    let
                        newElement =
                            { kanji = model.kanji
                            , keyword = model.keyword
                            , note = model.note
                            , svg = model.svg
                            , parts = model.currentParts
                            }

                        newWork =
                            updateWorkElement model.currentWorkIndex newElement model.workElements

                        newModel =
                            { model | workElements = newWork }
                    in
                    if String.length body > 0 then
                        ( { model | userMessage = Dict.insert "KeywordSubmitReady" ("Error submitting keyword. Details:" ++ body) model.userMessage }, Cmd.none )

                    else
                        update NextWorkElement { newModel | userMessage = Dict.empty }

                Err _ ->
                    ( { model | userMessage = Dict.insert "KeywordSubmitReady" "Error submitting keyword. Details unknown." model.userMessage }, Cmd.none )

        NextWorkElement ->
            update (SelectWorkElement (model.currentWorkIndex + 1)) model

        SelectWorkElement index ->
            let
                fixWorkModel =
                    chooseWorkElement index model

                newModel =
                    { fixWorkModel | userMessage = Dict.empty }

                keywordPresentCommands =
                    Cmd.batch
                        [ getKeywordCheck newModel.currentParts ]

                keywordAbsentCommands =
                    Cmd.batch
                        []
            in
            if String.length newModel.keyword >= 2 then
                ( newModel, keywordPresentCommands )

            else
                ( newModel, keywordAbsentCommands )

        SelectPart index ->
            let
                newModel =
                    choosePart index model
            in
            if List.length newModel.currentParts >= 1 then
                ( newModel, Cmd.batch [ getKeywordCheck newModel.currentParts ] )

            else
                ( { newModel | userMessage = Dict.empty }, Cmd.none )

        NotesInput word ->
            ( { model | note = word }, Cmd.none )

        WorkElementsReady result ->
            case result of
                Ok elements ->
                    let
                        newModel =
                            { model | workElements = elements, userMessage = Dict.remove "WorkElementsReady" model.userMessage }
                    in
                    update NextWorkElement newModel

                Err _ ->
                    ( { model | userMessage = Dict.insert "WorkElementsReady" "Error getting workElements" model.userMessage }, Cmd.none )

        PartsReady result ->
            case result of
                Ok newParts ->
                    ( { model | parts = newParts, userMessage = Dict.remove "PartsReady" model.userMessage }, Cmd.none )

                Err _ ->
                    ( { model | userMessage = Dict.insert "PartsReady" "Error getting parts" model.userMessage }, Cmd.none )

        KeywordCheckReady result ->
            case result of
                Ok elements ->
                    ( { model | similarKanji = elements, userMessage = Dict.remove "KeywordCheckReady" model.userMessage }, Cmd.none )

                Err _ ->
                    ( { model | userMessage = Dict.insert "KeywordCheckReady" "Error getting similar kanji" model.userMessage }, Cmd.none )

        SvgClick idAttr ->
            ( { model | svgSelectedId = idAttr }, Cmd.none )


chooseWorkElement : Int -> Model -> Model
chooseWorkElement index model =
    let
        selected =
            Maybe.withDefault (WorkElement "X" "Error" "An error occurred" "" []) (get index model.workElements)

        _ =
            Debug.log "Selecting element: " selected
    in
    { model
        | currentWorkIndex = index
        , kanji = selected.kanji
        , keyword = selected.keyword
        , note = selected.note
        , svg = selected.svg
        , currentParts = selected.parts
    }


choosePart : Int -> Model -> Model
choosePart index model =
    let
        selected =
            Maybe.withDefault (WorkElement "X" "Error" "An error occurred" "" []) (get index model.parts)

        _ =
            Debug.log "Selecting part: " selected

        newParts =
            if List.member selected.keyword model.currentParts then
                List.Extra.remove selected.keyword model.currentParts

            else
                selected.keyword :: model.currentParts
    in
    { model | currentParts = newParts }


updateWorkElement : Int -> WorkElement -> List WorkElement -> List WorkElement
updateWorkElement index newElement list =
    let
        updator i elem =
            if i == index then
                newElement

            else
                elem
    in
    List.indexedMap updator list


get : Int -> List a -> Maybe a
get index list =
    List.head (List.drop index list)


getWorkElements : Cmd Msg
getWorkElements =
    Http.get
        { url = absolute [ "api", "work" ] []
        , expect = Http.expectJson WorkElementsReady workElementsDecoder
        }


getParts : Cmd Msg
getParts =
    Http.get
        { url = absolute [ "api", "parts" ] []
        , expect = Http.expectJson PartsReady workElementsDecoder
        }


workElementsDecoder : Decode.Decoder (List WorkElement)
workElementsDecoder =
    Decode.list
        (Decode.map5 WorkElement
            (Decode.index 0 Decode.string)
            (Decode.index 1 Decode.string)
            (Decode.index 2 Decode.string)
            (Decode.index 3 Decode.string)
            (Decode.index 4 (Decode.list Decode.string))
        )


getKeywordCheck : List String -> Cmd Msg
getKeywordCheck parts =
    Http.post
        { url = absolute [ "api", "keywordcheck" ] []
        , body = Http.jsonBody (getKeywordCheckEncoder parts)
        , expect = Http.expectJson KeywordCheckReady workElementsDecoder
        }


submitKeyword : Model -> Cmd Msg
submitKeyword model =
    Http.post
        { url = absolute [ "api", "submit" ] []
        , body = Http.jsonBody (submitKeywordEncoder model)
        , expect = Http.expectString KeywordSubmitReady
        }


submitKeywordEncoder : Model -> Encode.Value
submitKeywordEncoder model =
    Encode.object
        [ ( "kanji", Encode.string model.kanji )
        , ( "keyword", Encode.string model.keyword )
        , ( "note", Encode.string model.note )
        ]


getKeywordCheckEncoder : List String -> Encode.Value
getKeywordCheckEncoder parts =
    Encode.object
        [ ( "parts", Encode.list Encode.string parts )
        ]



-- VIEW


view : Model -> Document Msg
view model =
    Document "Kanji" [ render model ]



-- Render SVG
-- see: https://discourse.elm-lang.org/t/load-svg-externally-and-wire-to-elm-model/6842
-- see: https://ellie-app.com/ckpfYCRq7k7a1
-- note that Html and Svg types are aliases for VirtualDom type


stringToSvgHtml : (Element -> List (Svg.Attribute Msg)) -> String -> Html Msg
stringToSvgHtml customiser svgString =
    case SvgParser.parseToNode svgString of
        Ok svgNode ->
            cleanupSvg customiser svgNode

        Err e ->
            Svg.text ("Error svg: " ++ e)



-- Copied from the source code of SvgParser repo


cleanupSvg : (Element -> List (Svg.Attribute Msg)) -> SvgNode -> Svg Msg
cleanupSvg customiser svgNode =
    case svgNode of
        SvgElement element ->
            let
                cleanupSvgWithCustomiser =
                    cleanupSvg customiser

                customisedAttributes =
                    customiser element
            in
            Svg.node element.name
                customisedAttributes
                (List.map cleanupSvgWithCustomiser element.children)

        SvgText content ->
            Svg.text content

        SvgComment content ->
            Svg.text ""


svgCustomiseHighlight : Element -> List (Svg.Attribute Msg)
svgCustomiseHighlight element =
    let
        finalAttributes =
            if List.length element.children == 0 then
                let
                    isStyle =
                        \( name, value ) -> name == "style"

                    noStyle =
                        List.Extra.filterNot isStyle element.attributes

                    base =
                        List.map SvgParser.toAttribute noStyle

                    newStyle =
                        -- Note! SA.class and HA.class are incompatiable
                        [ SA.class "svgCentralHighlight" ]

                    idAttr =
                        getAttributeValue "id" element

                    clickAttributes =
                        [ Html.Events.onClick (SvgClick idAttr) ]
                in
                base ++ newStyle ++ clickAttributes

            else
                let
                    base =
                        List.map SvgParser.toAttribute element.attributes
                in
                base
    in
    finalAttributes


getAttributeValue : String -> Element -> String
getAttributeValue attributeName element =
    let
        searchAttribute =
            \( name, value ) -> name == attributeName
    in
    case List.Extra.find searchAttribute element.attributes of
        Nothing ->
            let
                _ =
                    Debug.log "PANIC" element.attributes
            in
            ""

        Just idAttr ->
            second idAttr


renderSinglePart : Int -> WorkElement -> Html Msg
renderSinglePart index elem =
    div
        [ HA.class "row"
        , onClick <| SelectPart index
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
            , value (String.fromInt index)
            ]
            [ text (String.fromInt index ++ ".") ]
        , rawsvg
            [ style "flex" "0 0 auto"
            , style "margin" "0 0.5rem"
            , attribute "src" elem.svg
            ]
            []
        , span
            [ style "flex" "1 0 4rem"
            , style "margin" "0 0.5rem"
            , if String.length elem.keyword > 0 then
                style "background-color" "rgb(200, 210, 200)"

              else
                style "background-color" ""
            ]
            [ text elem.keyword ]
        ]


renderParts : List WorkElement -> Html Msg
renderParts parts =
    div
        []
        (List.indexedMap renderSinglePart parts)


renderSingleWorkElement : Int -> WorkElement -> Html Msg
renderSingleWorkElement index elem =
    div
        [ HA.class "row"
        , onClick <| SelectWorkElement index
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
            , value (String.fromInt index)
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "flex" "0 0 auto"
            , style "margin" "0 0.5rem"
            ]
            [ text elem.kanji ]
        , span
            [ style "flex" "1 0 4rem"
            , style "margin" "0 0.5rem"
            , if String.length elem.keyword > 0 then
                style "background-color" "rgb(200, 210, 200)"

              else
                style "background-color" ""
            ]
            [ text elem.keyword ]
        , span
            [ style "flex" "10 1 auto"
            , if String.length elem.note > 0 then
                style "background-color" "rgb(200, 200, 210)"

              else
                style "background-color" ""
            ]
            [ text elem.note ]
        ]


renderWorkElements : List WorkElement -> Html Msg
renderWorkElements workElements =
    div
        []
        (List.indexedMap renderSingleWorkElement workElements)


renderUserMessages : Model -> Html Msg
renderUserMessages model =
    div [] [ text (String.join "!" (Dict.values model.userMessage)) ]



--getElementByKey : List WorkElement -> String -> WorkElement
--getElementByKey elements keyword =
--    List.Extra.find (\elem -> elem.keyword == keyword) elements
--
--
--getFullCurrentParts : List WorkElement -> List String -> List WorkElement
--getFullCurrentParts elements keywords =
--    let
--        getPart =
--            getElementByKey elements
--    in
--    List.map getPart keywords


renderSingleCurrentPart : ( Int, WorkElement ) -> Html Msg
renderSingleCurrentPart pair =
    let
        index =
            Tuple.first pair

        elem =
            Tuple.second pair
    in
    div
        [ HA.class "row"
        , onClick <| SelectPart index
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
            , value (String.fromInt index)
            ]
            [ text (String.fromInt index ++ ".") ]
        , rawsvg
            [ style "flex" "0 0 auto"
            , style "margin" "0 0.5rem"
            , attribute "src" elem.svg
            ]
            []
        , span
            [ style "flex" "1 0 4rem"
            , style "margin" "0 0.5rem"
            , if String.length elem.keyword > 0 then
                style "background-color" "rgb(200, 210, 200)"

              else
                style "background-color" ""
            ]
            [ text elem.keyword ]
        ]


presense : List String -> ( Int, WorkElement ) -> Bool
presense currentParts pair =
    let
        index =
            Tuple.first pair

        elem =
            Tuple.second pair

        keyword =
            elem.keyword
    in
    List.member keyword currentParts


renderCurrentParts : List WorkElement -> List String -> Html Msg
renderCurrentParts parts currentParts =
    let
        indexedParts =
            List.indexedMap Tuple.pair parts

        filter =
            presense currentParts

        filteredParts =
            List.filter filter indexedParts

        _ =
            Debug.log "ARTEM: filteredParts" filteredParts
    in
    div
        []
        (List.map renderSingleCurrentPart filteredParts)


renderSubmitBar : Model -> Html Msg
renderSubmitBar model =
    let
        join =
            \s1 s2 -> s1 ++ ", " ++ s2

        txt =
            List.foldl join "" model.currentParts
    in
    div [ style "display" "flex" ]
        [ span
            [ style "flex" "1 0 auto" ]
            [ if String.length model.svg > 0 then
                let
                    renderCentralKanji =
                        stringToSvgHtml svgCustomiseHighlight
                in
                renderCentralKanji model.svg

              else
                text ""
            ]
        , span
            [ style "flex" "10 0 70px"
            , style "background-color" "rgb(250, 210, 210)"
            ]
            [ renderCurrentParts model.parts model.currentParts
            ]
        , span
            [ style "flex" "1 0 auto" ]
            [ button [ onClick KeywordSubmitClick ] [ text "Submit" ] ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "Notes"
                , value model.note
                , onInput NotesInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        ]


render : Model -> Html Msg
render model =
    -- central css grid container
    div
        [ style "display" "grid"
        , style "grid-template-columns" "1px 2fr 1fr 2fr 1px"
        , style "grid-template-rows" "1px 33vh 33vh"
        ]
        [ -- Keyword submit
          div
            [ style "background-color" "rgb(220, 250, 250)"
            , style "grid-column" "2 / 3"
            , style "grid-row" "2 / 3"
            , style "overflow" "auto"
            ]
            [ renderUserMessages model
            , renderSubmitBar model
            ]

        -- WorkElement select
        , div
            [ style "background-color" "rgb(210, 210, 210)"
            , style "grid-column" "4 / 5"
            , style "grid-row" "2 / 4"
            , style "overflow" "auto"
            ]
            [ div [] [ text "Work Elements Progress" ]
            , lazy renderWorkElements model.workElements
            ]

        -- Parts select
        , div
            [ style "background-color" "rgb(250, 210, 250)"
            , style "grid-column" "3 / 4"
            , style "grid-row" "2 / 4"
            , style "overflow" "auto"
            ]
            [ div [] [ text "Parts" ]
            , lazy renderParts model.parts
            ]
        ]
